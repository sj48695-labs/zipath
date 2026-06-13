import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { XMLParser } from "fast-xml-parser";
import { Announcement, SubscriptionCriteria } from "@zipath/db";
import { Cron } from "@nestjs/schedule";
import { MatchRequestDto } from "./dto/match-request.dto";
import { MatchResultDto, MatchCriterionResult } from "./dto/match-result.dto";
import { MatchAllResultDto, MATCH_DISCLAIMER } from "./dto/match-all-result.dto";

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
  // 숫자형 텍스트도 string 으로 유지 (관리번호/공고번호 포맷 보존)
  private readonly xmlParser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

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
      // data.go.kr 키는 Encoding/Decoding 두 형식이 있음. URLSearchParams 가
      // 재인코딩 하므로 디코딩된 형태를 넘겨야 한 번만 인코딩 됨.
      // (decode 가 이미 디코딩된 키에는 무영향이라 양쪽 형식 모두 안전)
      let key = serviceKey;
      try { key = decodeURIComponent(serviceKey); } catch { /* keep raw */ }

      const params = new URLSearchParams({
        serviceKey: key,
        pageNo: "1",
        numOfRows: "50",
        type: "json",
      });

      const res = await fetch(`${this.apiBase}?${params.toString()}`);
      const text = await res.text();

      if (!res.ok) {
        this.logger.error(
          `API 응답 오류: ${res.status} | url=${this.apiBase} | body=${text.slice(0, 300)}`,
        );
        return;
      }

      // data.go.kr 는 `type=json` 을 무시하고 XML 만 반환할 수 있음.
      // 정상 응답도 XML (`<response><header><resultCode>000`), 에러도 XML
      // (`<OpenAPI_ServiceResponse><cmmMsgHeader>`) — 파싱 후 resultCode 로 분기.
      const data = text.trimStart().startsWith("<")
        ? this.xmlParser.parse(text)
        : JSON.parse(text);

      const errHeader = data?.OpenAPI_ServiceResponse?.cmmMsgHeader;
      if (errHeader) {
        this.logger.error(
          `data.go.kr API error | code=${errHeader.returnReasonCode ?? ""} | auth=${errHeader.returnAuthMsg ?? ""} | err=${errHeader.errMsg ?? ""} | url=${this.apiBase}`,
        );
        return;
      }

      const resultCode = data?.response?.header?.resultCode;
      if (resultCode && resultCode !== "000") {
        const resultMsg = data?.response?.header?.resultMsg ?? "";
        this.logger.error(
          `data.go.kr result error | code=${resultCode} | msg=${resultMsg} | url=${this.apiBase}`,
        );
        return;
      }

      const rawItems = data?.response?.body?.items?.item;
      const items: ApiAnnouncement[] = Array.isArray(rawItems)
        ? (rawItems as ApiAnnouncement[])
        : rawItems
          ? [rawItems as ApiAnnouncement]
          : [];

      if (items.length === 0) {
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
    return this.computeMatchForEntity(announcement, input);
  }

  /**
   * 사용자 조건으로 신청 가능한 전체 공고를 자동 매칭한다.
   * 마감 전(`endDate >= now`) 공고만 대상으로 하며,
   * 지원 가능(`overallEligible === true`)한 공고만 반환한다.
   */
  async matchAllAnnouncements(
    input: MatchRequestDto,
  ): Promise<MatchAllResultDto> {
    const activeAnnouncements = await this.announcementRepo
      .createQueryBuilder("a")
      .where("a.endDate >= :now", { now: new Date() })
      .orderBy("a.endDate", "ASC")
      .getMany();

    const matches: MatchResultDto[] = [];
    for (const announcement of activeAnnouncements) {
      const result = await this.computeMatchForEntity(announcement, input);
      if (result.overallEligible) {
        matches.push(result);
      }
    }

    return {
      matchedCount: matches.length,
      matches,
      disclaimer: MATCH_DISCLAIMER,
    };
  }

  /** 이미 로드된 엔티티로 매칭 결과를 계산한다 (DB 재조회 없음) */
  private async computeMatchForEntity(
    announcement: Announcement,
    input: MatchRequestDto,
  ): Promise<MatchResultDto> {
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
    const { age, income, homelessMonths, dependents = 0, isMarried = false, isFirstHome = false, region } = input;

    const regionMatch = !region || announcement.region === region;

    // 1순위 일반
    if (age >= 19 && homelessMonths >= 24 && income <= 6000) {
      results.push({
        criterion: "1순위 일반",
        eligible: regionMatch,
        reason: regionMatch
          ? "기본 자격 충족"
          : `지역 불일치 (공고: ${announcement.region}, 입력: ${region})`,
      });
    } else {
      const reasons: string[] = [];
      if (age < 19) reasons.push("만 19세 미만");
      if (homelessMonths < 24) reasons.push("무주택 기간 24개월 미만");
      if (income > 6000) reasons.push("소득 기준 초과");
      results.push({
        criterion: "1순위 일반",
        eligible: false,
        reason: reasons.join("; "),
      });
    }

    // 2순위
    if (age >= 19) {
      results.push({
        criterion: "2순위",
        eligible: regionMatch,
        reason: regionMatch ? "만 19세 이상 신청 가능 (당첨 확률 낮음)" : "지역 불일치",
      });
    }

    // 특별공급 - 신혼부부
    if (isMarried && income <= 7000) {
      results.push({
        criterion: "특별공급 (신혼부부)",
        eligible: regionMatch,
        reason: regionMatch ? "소득 기준 충족" : "지역 불일치",
      });
    } else if (isMarried) {
      results.push({
        criterion: "특별공급 (신혼부부)",
        eligible: false,
        reason: `소득 기준 초과 (${income}만원 > 7,000만원)`,
      });
    }

    // 특별공급 - 생애최초
    if (isFirstHome && income <= 6000) {
      results.push({
        criterion: "특별공급 (생애최초)",
        eligible: regionMatch,
        reason: regionMatch ? "무주택 + 소득 기준 충족" : "지역 불일치",
      });
    } else if (isFirstHome) {
      results.push({
        criterion: "특별공급 (생애최초)",
        eligible: false,
        reason: `소득 기준 초과 (${income}만원 > 6,000만원)`,
      });
    }

    // 특별공급 - 다자녀
    if (dependents >= 3) {
      results.push({
        criterion: "특별공급 (다자녀)",
        eligible: regionMatch,
        reason: regionMatch ? `미성년 자녀 ${dependents}명 (3명 이상)` : "지역 불일치",
      });
    }

    // 특별공급 - 노부모부양
    if (dependents > 0 && age >= 25 && homelessMonths >= 36) {
      results.push({
        criterion: "특별공급 (노부모부양)",
        eligible: regionMatch,
        reason: regionMatch ? "만 25세 이상, 무주택 3년 이상, 부양가족 있음" : "지역 불일치",
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
