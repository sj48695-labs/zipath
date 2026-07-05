import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import {
  Announcement,
  Notification,
  NotificationPreference,
  RealPriceCache,
} from "@zipath/db";

type NotificationWithReferenceId = Notification & {
  referenceId: string | null;
};

/**
 * 실거래가/공고 변동 감지 스케줄러.
 *
 * - 가격: 30분 주기로 활성 preference 순회 → region/yearMonth 의 최근 2개
 *   RealPriceCache 평균가 비교 → 변동률 ≥ 5% 시 Notification 생성.
 * - 공고: 매시 정각 — 최근 70분 내 생성된 Announcement 와 활성 preference 의
 *   regions/keywords 매칭 시 Notification 생성.
 *
 * 중복 알림 방지: `(userId, type, referenceId)` 조합으로 1회 count 조회 후
 * 0 인 경우에만 insert. DB 레벨 partial unique index 도 추가로 보호함.
 *
 * 본 서비스는 참고용이며 법적 효력이 없습니다.
 */
@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  /** 가격 변동 알림을 발화할 최소 변동률 (±5%) */
  private static readonly PRICE_CHANGE_PCT = 0.05;

  /** 공고 신규 인정 윈도 (분) — cron 주기보다 약간 길게 설정 */
  private static readonly ANNOUNCEMENT_WINDOW_MIN = 70;

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(RealPriceCache)
    private readonly cacheRepo: Repository<RealPriceCache>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<NotificationWithReferenceId>,
  ) {}

  // --------------------------- 가격 변동 ---------------------------

  @Cron("*/30 * * * *") // 30분마다
  async detectPriceChange(): Promise<void> {
    try {
      const prefs = await this.preferenceRepo.find({
        where: { isActive: true },
      });
      if (prefs.length === 0) return;

      for (const pref of prefs) {
        for (const region of pref.regions) {
          await this.checkPriceForRegion(pref, region);
        }
      }
    } catch (err) {
      this.logger.error(
        `detectPriceChange 실패: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async checkPriceForRegion(
    pref: NotificationPreference,
    region: string,
  ): Promise<void> {
    // 해당 지역의 최신 2개 캐시 (fetchedAt 내림차순)
    const caches = await this.cacheRepo.find({
      where: { regionCode: region },
      order: { fetchedAt: "DESC" },
      take: 2,
    });
    // baseline: 이전값이 없으면 알림 스킵
    if (caches.length < 2) return;

    const [current, previous] = caches;
    const currentAvg = this.calcAvg(current);
    const previousAvg = this.calcAvg(previous);
    if (currentAvg <= 0 || previousAvg <= 0) return;

    const changePct = Math.abs(currentAvg - previousAvg) / previousAvg;
    if (changePct < NotificationSchedulerService.PRICE_CHANGE_PCT) return;

    const referenceId = `${region}:${current.yearMonth}`;
    const exists = await this.notificationRepo.count({
      where: { userId: pref.userId, type: "price_change", referenceId },
    });
    if (exists > 0) return;

    const direction = currentAvg > previousAvg ? "상승" : "하락";
    const pctStr = (changePct * 100).toFixed(1);
    const notification = this.notificationRepo.create({
      userId: pref.userId,
      type: "price_change",
      title: `[${region}] 실거래가 ${direction} ${pctStr}%`,
      message: `${region} 평균 거래가가 직전 대비 ${pctStr}% ${direction}했습니다. (참고용)`,
      referenceId,
      readAt: null,
    } as Partial<Notification>);
    await this.notificationRepo.save(notification);
  }

  /** RealPriceCache.data 의 dealAmount 평균 계산 */
  private calcAvg(cache: RealPriceCache): number {
    const trades = (cache.data ?? []) as unknown as Array<{
      dealAmount?: string;
    }>;
    if (!Array.isArray(trades) || trades.length === 0) return 0;
    const prices = trades
      .map((t) =>
        parseInt(String(t.dealAmount ?? "0").replace(/[,\s]/g, ""), 10),
      )
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length === 0) return 0;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  // --------------------------- 신규 공고 ---------------------------

  @Cron("0 * * * *") // 매시 정각
  async detectNewAnnouncement(): Promise<void> {
    try {
      const since = new Date(
        Date.now() -
          NotificationSchedulerService.ANNOUNCEMENT_WINDOW_MIN * 60 * 1000,
      );
      const newAnnouncements = await this.announcementRepo.find({
        where: { createdAt: MoreThan(since) },
        order: { createdAt: "DESC" },
      });
      if (newAnnouncements.length === 0) return;

      const prefs = await this.preferenceRepo.find({
        where: { isActive: true },
      });
      if (prefs.length === 0) return;

      for (const announcement of newAnnouncements) {
        for (const pref of prefs) {
          if (!this.matchesPreference(announcement, pref)) continue;
          await this.createAnnouncementNotification(pref, announcement);
        }
      }
    } catch (err) {
      this.logger.error(
        `detectNewAnnouncement 실패: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private matchesPreference(
    announcement: Announcement,
    pref: NotificationPreference,
  ): boolean {
    // 지역: preference 의 region 들 중 하나라도 공고 region 에 포함되어야 함.
    const regionMatched = pref.regions.some((r) =>
      announcement.region.includes(r),
    );
    if (!regionMatched) return false;

    // 키워드: 비어있으면 통과, 있으면 title 에 키워드 중 하나 이상 포함되어야 함.
    if (pref.announcementKeywords.length === 0) return true;
    return pref.announcementKeywords.some((k) =>
      announcement.title.includes(k),
    );
  }

  private async createAnnouncementNotification(
    pref: NotificationPreference,
    announcement: Announcement,
  ): Promise<void> {
    const referenceId = `announcement:${announcement.id}`;
    const exists = await this.notificationRepo.count({
      where: { userId: pref.userId, type: "announcement", referenceId },
    });
    if (exists > 0) return;

    const notification = this.notificationRepo.create({
      userId: pref.userId,
      type: "announcement",
      title: `[신규 공고] ${announcement.title}`,
      message: `${announcement.region} ${announcement.supplyType} 공고가 등록됐어요. (참고용)`,
      referenceId,
      readAt: null,
    } as Partial<Notification>);
    await this.notificationRepo.save(notification);
  }
}
