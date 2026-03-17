import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Announcement, SubscriptionCriteria } from "@zipath/db";
import { Cron } from "@nestjs/schedule";
import { MatchRequestDto } from "./dto/match-request.dto";
import { MatchResultDto, MatchCriterionResult } from "./dto/match-result.dto";

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
    @InjectRepository(SubscriptionCriteria)
    private readonly criteriaRepo: Repository<SubscriptionCriteria>,
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

  /** 사용자 입력과 공고 요건 자동 매칭 */
  async matchAnnouncement(
    announcementId: number,
    input: MatchRequestDto,
  ): Promise<MatchResultDto | null> {
    const announcement = await this.announcementRepo.findOne({
      where: { id: announcementId },
    });
    if (!announcement) return null;

    // 해당 공고의 청약 기준 조회 (DB에 저장된 기준이 있으면 활용)
    const criteriaQb = this.criteriaRepo.createQueryBuilder("c");
    if (announcement.region) {
      criteriaQb.where("c.region = :region OR c.region IS NULL", {
        region: announcement.region,
      });
    }
    const criteria = await criteriaQb.getMany();

    const results: MatchCriterionResult[] = [];

    if (criteria.length > 0) {
      // DB에 저장된 기준이 있는 경우 각 기준별로 매칭
      for (const criterion of criteria) {
        const reasons: string[] = [];
        let eligible = true;

        if (criterion.minAge !== null && input.age < criterion.minAge) {
          eligible = false;
          reasons.push(`나이 ${criterion.minAge}세 이상 필요 (현재 ${input.age}세)`);
        }

        if (
          criterion.maxIncome !== null &&
          input.income > criterion.maxIncome
        ) {
          eligible = false;
          reasons.push(
            `소득 ${criterion.maxIncome}만원 이하 필요 (현재 ${input.income}만원)`,
          );
        }

        if (
          criterion.minHomeless !== null &&
          input.homelessMonths < criterion.minHomeless
        ) {
          eligible = false;
          reasons.push(
            `무주택 기간 ${criterion.minHomeless}개월 이상 필요 (현재 ${input.homelessMonths}개월)`,
          );
        }

        if (
          criterion.region !== null &&
          input.region &&
          criterion.region !== input.region
        ) {
          eligible = false;
          reasons.push(
            `지역 불일치 (요구: ${criterion.region}, 입력: ${input.region})`,
          );
        }

        results.push({
          criterion: criterion.type,
          eligible,
          reason: eligible
            ? "자격 요건 충족"
            : reasons.join("; "),
        });
      }
    } else {
      // DB에 기준이 없으면 기본 로직으로 판별 (subscription 서비스 패턴 참고)
      results.push(
        ...this.applyDefaultCriteria(announcement, input),
      );
    }

    const overallEligible = results.some((r) => r.eligible);

    return {
      announcementId: announcement.id,
      announcementTitle: announcement.title,
      overallEligible,
      results,
      message: overallEligible
        ? "해당 공고에 지원 가능한 유형이 있습니다!"
        : "현재 조건으로는 해당 공고 지원이 어렵습니다.",
    };
  }

  /** DB에 기준이 없을 때 기본 판별 로직 */
  private applyDefaultCriteria(
    announcement: Announcement,
    input: MatchRequestDto,
  ): MatchCriterionResult[] {
    const results: MatchCriterionResult[] = [];

    // 지역 매칭 확인
    const regionMatch =
      !input.region || announcement.region === input.region;

    // 1순위 일반
    if (input.age >= 19 && input.homelessMonths >= 24 && input.income <= 6000) {
      results.push({
        criterion: "1순위 일반",
        eligible: regionMatch,
        reason: regionMatch
          ? "기본 자격 충족"
          : `지역 불일치 (공고: ${announcement.region}, 입력: ${input.region})`,
      });
    } else {
      const reasons: string[] = [];
      if (input.age < 19) reasons.push("만 19세 미만");
      if (input.homelessMonths < 24) reasons.push("무주택 기간 24개월 미만");
      if (input.income > 6000) reasons.push("소득 기준 초과");
      results.push({
        criterion: "1순위 일반",
        eligible: false,
        reason: reasons.join("; "),
      });
    }

    // 특별공급 - 신혼부부
    if (input.income <= 7000) {
      results.push({
        criterion: "특별공급 (신혼부부)",
        eligible: regionMatch,
        reason: regionMatch ? "소득 기준 충족" : `지역 불일치`,
      });
    }

    // 특별공급 - 생애최초
    if (input.homelessMonths >= 0 && input.income <= 6000) {
      results.push({
        criterion: "특별공급 (생애최초)",
        eligible: regionMatch,
        reason: regionMatch
          ? "무주택 + 소득 기준 충족"
          : `지역 불일치`,
      });
    }

    return results;
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
