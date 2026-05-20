import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import {
  Announcement,
  Notification,
  NotificationPreference,
  PriceBaseline,
} from "@zipath/db";
import type { RealPriceTrade } from "@zipath/types";
import { RealPriceService } from "../real-price/real-price.service";

const PRICE_CHANGE_THRESHOLD_PCT = 3; // ±3% 이상 변동 시 알림
const NOTIFICATION_TYPE_PRICE_CHANGE = "PRICE_CHANGE";
const NOTIFICATION_TYPE_NEW_ANNOUNCEMENT = "NEW_ANNOUNCEMENT";
const LAWD_CD_PATTERN = /^\d{5}$/;

interface PreferenceUserRegion {
  userId: number;
  regions: string[];
}

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  /**
   * 신규 공고 감지의 기준 시각. 콜드 스타트 후 첫 사이클은 알림 없이 시각만 기록한다.
   * 영속성이 필요한 경우 후속 PR에서 별도 상태 테이블로 확장.
   */
  private lastAnnouncementCheckAt: Date | null = null;

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(PriceBaseline)
    private readonly baselineRepo: Repository<PriceBaseline>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    private readonly realPriceService: RealPriceService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleChangeDetection(): Promise<void> {
    this.logger.log("변동 감지 시작");
    await this.detectPriceChanges();
    await this.detectNewAnnouncements();
    this.logger.log("변동 감지 완료");
  }

  /**
   * 실거래가 변동 감지.
   * - 활성 NotificationPreference 의 LAWD_CD 5자리 지역만 비교 대상.
   * - PriceBaseline 미존재 시: 첫 기록이라 baseline 만 저장, 알림 미생성.
   * - 평균가 변동률이 ±PRICE_CHANGE_THRESHOLD_PCT 이상이면 알림 생성 후 baseline 갱신.
   * - 동일 (userId, type, referenceId) 알림이 이미 있으면 스킵.
   */
  async detectPriceChanges(): Promise<void> {
    const preferences = await this.preferenceRepo.findBy({ isActive: true });
    if (preferences.length === 0) {
      this.logger.log("활성 알림 설정 없음 — 가격 변동 감지 스킵");
      return;
    }

    const yearMonth = this.currentYearMonth();
    const dealType = "매매";
    let createdCount = 0;

    // 동일 지역코드는 한 번만 외부 호출 → 평균가 계산 후 사용자별로 알림 생성.
    const regionCodes = this.collectLawdRegions(preferences);

    for (const regionCode of regionCodes) {
      const { trades } = await this.realPriceService.search(
        regionCode,
        yearMonth,
      );
      const summary = this.summarizeTrades(trades);
      if (summary.tradeCount === 0) {
        continue;
      }

      const referenceId = `${regionCode}:${yearMonth}`;
      const baseline = await this.baselineRepo.findOne({
        where: { regionCode, dealType, yearMonth },
      });

      if (!baseline) {
        await this.baselineRepo.save(
          this.baselineRepo.create({
            regionCode,
            dealType,
            yearMonth,
            avgPrice: summary.avgPrice,
            tradeCount: summary.tradeCount,
          }),
        );
        continue;
      }

      const prevAvg = Number(baseline.avgPrice);
      if (prevAvg <= 0) continue;
      const changePct = ((summary.avgPrice - prevAvg) / prevAvg) * 100;
      if (Math.abs(changePct) < PRICE_CHANGE_THRESHOLD_PCT) {
        continue;
      }

      const usersForRegion = preferences.filter((p) =>
        p.regions.includes(regionCode),
      );
      for (const pref of usersForRegion) {
        const duplicate = await this.notificationRepo.findOne({
          where: {
            userId: pref.userId,
            type: NOTIFICATION_TYPE_PRICE_CHANGE,
            referenceId,
          },
        });
        if (duplicate) continue;

        await this.notificationRepo.save(
          this.notificationRepo.create({
            userId: pref.userId,
            type: NOTIFICATION_TYPE_PRICE_CHANGE,
            title: `실거래가 변동 알림 (${regionCode})`,
            message:
              `${yearMonth} ${regionCode} 평균가가 ${prevAvg.toLocaleString()}만원 → ` +
              `${summary.avgPrice.toLocaleString()}만원 (${changePct.toFixed(2)}%) 변동했어요. ` +
              `본 정보는 참고용이며 법적 효력이 없습니다.`,
            referenceId,
            readAt: null,
          }),
        );
        createdCount++;
      }

      // baseline 갱신은 알림 생성 여부와 무관하게 수행 (다음 사이클 기준 갱신)
      baseline.avgPrice = summary.avgPrice;
      baseline.tradeCount = summary.tradeCount;
      await this.baselineRepo.save(baseline);
    }

    this.logger.log(`실거래가 변동 알림 생성: ${createdCount}건`);
  }

  /**
   * 신규 공고 감지.
   * - lastAnnouncementCheckAt 이 null 인 첫 실행: 시각만 기록, 알림 미생성.
   * - 이후 사이클: createdAt > lastAnnouncementCheckAt 신규 공고 → 활성 preference 부분 매칭.
   */
  async detectNewAnnouncements(): Promise<void> {
    if (this.lastAnnouncementCheckAt === null) {
      this.lastAnnouncementCheckAt = new Date();
      this.logger.log("신규 공고 감지 첫 실행 — 기준 시각만 기록");
      return;
    }

    const since = this.lastAnnouncementCheckAt;
    const now = new Date();
    const newAnnouncements = await this.announcementRepo.findBy({
      createdAt: MoreThan(since),
    });
    if (newAnnouncements.length === 0) {
      this.lastAnnouncementCheckAt = now;
      this.logger.log("신규 공고 없음");
      return;
    }

    const preferences = await this.preferenceRepo.findBy({ isActive: true });
    let createdCount = 0;

    for (const announcement of newAnnouncements) {
      const referenceId = `announcement:${announcement.id}`;
      const matchedUsers = this.matchAnnouncementUsers(
        announcement,
        preferences,
      );

      for (const pref of matchedUsers) {
        const duplicate = await this.notificationRepo.findOne({
          where: {
            userId: pref.userId,
            type: NOTIFICATION_TYPE_NEW_ANNOUNCEMENT,
            referenceId,
          },
        });
        if (duplicate) continue;

        await this.notificationRepo.save(
          this.notificationRepo.create({
            userId: pref.userId,
            type: NOTIFICATION_TYPE_NEW_ANNOUNCEMENT,
            title: `신규 공고: ${announcement.title}`,
            message:
              `관심 지역(${announcement.region})에 신규 공고가 등록됐어요. ` +
              `본 정보는 참고용이며 법적 효력이 없습니다.`,
            referenceId,
            readAt: null,
          }),
        );
        createdCount++;
      }
    }

    this.lastAnnouncementCheckAt = now;
    this.logger.log(`신규 공고 알림 생성: ${createdCount}건`);
  }

  /** 테스트/운영 점검용. 외부에서 첫 실행 상태로 초기화. */
  resetAnnouncementCheckpoint(): void {
    this.lastAnnouncementCheckAt = null;
  }

  private collectLawdRegions(preferences: NotificationPreference[]): string[] {
    const set = new Set<string>();
    for (const pref of preferences) {
      for (const region of pref.regions ?? []) {
        if (LAWD_CD_PATTERN.test(region)) {
          set.add(region);
        }
      }
    }
    return Array.from(set);
  }

  private summarizeTrades(
    trades: RealPriceTrade[],
  ): { avgPrice: number; tradeCount: number } {
    const prices = trades
      .map((t) => parseInt(String(t.dealAmount ?? "").replace(/,/g, "").trim(), 10))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (prices.length === 0) return { avgPrice: 0, tradeCount: 0 };
    const sum = prices.reduce((a, b) => a + b, 0);
    return {
      avgPrice: Math.round(sum / prices.length),
      tradeCount: prices.length,
    };
  }

  private matchAnnouncementUsers(
    announcement: Announcement,
    preferences: NotificationPreference[],
  ): PreferenceUserRegion[] {
    const region = announcement.region ?? "";
    return preferences.filter((pref) =>
      (pref.regions ?? []).some((prefRegion) =>
        this.isRegionMatch(region, prefRegion),
      ),
    );
  }

  /**
   * 관심 지역(prefRegion)이 공고 region 과 매칭되는지 판정.
   * - LAWD_CD 형식은 공고 region 텍스트와 매칭 불가 → false.
   * - 양방향 부분 문자열 매칭 우선 ("서울 강남구" ↔ "서울 강남구").
   * - 둘 다 실패하면 공백 토큰으로 분해해 각 토큰이 공고에 포함되는지 검사
   *   ("서울 강남구" → ["서울","강남구"] 가 "서울특별시 강남구" 에 모두 포함 → match).
   */
  private isRegionMatch(announcementRegion: string, prefRegion: string): boolean {
    if (!prefRegion || !announcementRegion) return false;
    if (LAWD_CD_PATTERN.test(prefRegion)) return false;
    if (
      announcementRegion.includes(prefRegion) ||
      prefRegion.includes(announcementRegion)
    ) {
      return true;
    }
    const tokens = prefRegion.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) return false;
    return tokens.every((token) => announcementRegion.includes(token));
  }

  private currentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
}
