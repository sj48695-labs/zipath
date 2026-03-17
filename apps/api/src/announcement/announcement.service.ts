import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Announcement } from "@zipath/db";
import { Cron } from "@nestjs/schedule";

interface ApiAnnouncement {
  HOUSE_MANAGE_NO: string;
  PBLANC_NO: string;
  HOUSE_NM: string;
  HOUSE_SECD_NM: string;
  HSSPLY_ADRES: string;
  TOT_SUPLY_HSHLDCO: number;
  RCEPT_BGNDE: string;
  RCEPT_ENDDE: string;
  PRZWNER_PRESNATN_DE: string;
  SUBSCRPT_AREA_CODE_NM: string;
  HOUSE_DTL_SECD_NM: string;
  PBLANC_URL: string;
}

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);
  private readonly apiBase =
    "https://apis.data.go.kr/B552555/lttotPblancList/getAPTLttotPblancList";

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    private readonly config: ConfigService,
  ) {}

  /** 목록 조회 (DB 우선, 없으면 API 동기화) */
  async findAll(page: number, limit: number, region?: string) {
    const qb = this.announcementRepo
      .createQueryBuilder("a")
      .orderBy("a.startDate", "DESC");

    if (region) {
      qb.andWhere("a.region = :region", { region });
    }

    const [items, totalCount] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // DB에 데이터가 없으면 API에서 동기화
    if (totalCount === 0) {
      await this.syncFromApi();
      const [synced, syncedCount] = await qb.getManyAndCount();
      return {
        items: synced.map(this.toDto),
        totalCount: syncedCount,
        page,
        limit,
      };
    }

    return {
      items: items.map(this.toDto),
      totalCount,
      page,
      limit,
    };
  }

  /** 상세 조회 */
  async findOne(id: number) {
    const announcement = await this.announcementRepo.findOne({
      where: { id },
    });
    if (!announcement) return null;
    return this.toDto(announcement);
  }

  /** 매일 오전 6시에 공고 동기화 */
  @Cron("0 6 * * *")
  async syncFromApi() {
    this.logger.log("공공분양 공고 동기화 시작...");
    const serviceKey = this.config.get<string>("DATA_GO_KR_API_KEY");
    if (!serviceKey) {
      this.logger.error("DATA_GO_KR_API_KEY 미설정");
      return;
    }

    try {
      const params = new URLSearchParams({
        serviceKey,
        pageNo: "1",
        numOfRows: "50",
        type: "json",
      });

      const res = await fetch(`${this.apiBase}?${params.toString()}`);
      if (!res.ok) {
        this.logger.error(`API 응답 오류: ${res.status}`);
        return;
      }

      const data = await res.json();
      const items: ApiAnnouncement[] =
        data?.response?.body?.items?.item ?? [];

      if (!Array.isArray(items) || items.length === 0) {
        this.logger.warn("동기화할 공고 데이터 없음");
        return;
      }

      let created = 0;
      for (const item of items) {
        const existingKey = `${item.HOUSE_MANAGE_NO}-${item.PBLANC_NO}`;

        // 이미 저장된 공고인지 확인 (title + organization 조합)
        const existing = await this.announcementRepo.findOne({
          where: { title: item.HOUSE_NM, organization: existingKey },
        });

        if (existing) continue;

        const announcement = this.announcementRepo.create({
          title: item.HOUSE_NM || "공고",
          organization: existingKey,
          region: item.SUBSCRPT_AREA_CODE_NM || "전국",
          supplyType: item.HOUSE_DTL_SECD_NM || item.HOUSE_SECD_NM || "공공분양",
          startDate: this.parseDate(item.RCEPT_BGNDE),
          endDate: this.parseDate(item.RCEPT_ENDDE),
          detailUrl: item.PBLANC_URL || null,
          summary: this.buildSummary(item),
          rawData: item as unknown as Record<string, unknown>,
        });

        await this.announcementRepo.save(announcement);
        created++;
      }

      this.logger.log(`공고 동기화 완료: ${created}건 신규 저장`);
    } catch (err) {
      this.logger.error(
        `동기화 실패: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    // "20260315" → Date
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    return new Date(`${y}-${m}-${d}`);
  }

  private buildSummary(item: ApiAnnouncement): string {
    const parts = [
      item.HOUSE_NM,
      item.HSSPLY_ADRES,
      `총 ${item.TOT_SUPLY_HSHLDCO}세대`,
      `접수: ${item.RCEPT_BGNDE} ~ ${item.RCEPT_ENDDE}`,
    ];
    return parts.filter(Boolean).join(" | ");
  }

  private toDto(a: Announcement) {
    return {
      id: a.id,
      title: a.title,
      region: a.region,
      supplyType: a.supplyType,
      startDate: a.startDate,
      endDate: a.endDate,
      detailUrl: a.detailUrl,
      summary: a.summary,
      rawData: a.rawData,
    };
  }
}
