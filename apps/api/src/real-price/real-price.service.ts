import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RealPriceCache } from "@zipath/db";
import type { RealPriceTrade, MonthlyPriceSummary } from "@zipath/types";

@Injectable()
export class RealPriceService {
  private readonly logger = new Logger(RealPriceService.name);
  private readonly apiBase =
    "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

  constructor(
    @InjectRepository(RealPriceCache)
    private readonly cacheRepo: Repository<RealPriceCache>,
    private readonly config: ConfigService,
  ) {}

  async search(regionCode: string, yearMonth: string, minArea?: number, maxArea?: number) {
    const dealType = "매매";

    // 1. DB 캐시 확인
    const cached = await this.cacheRepo.findOne({
      where: { regionCode, dealType, yearMonth },
    });

    if (cached) {
      this.logger.log(`Cache hit: ${regionCode}/${yearMonth}`);
      const trades = cached.data as unknown as RealPriceTrade[];
      const filtered = this.filterByArea(trades, minArea, maxArea);
      return {
        trades: filtered,
        totalCount: filtered.length,
        cached: true,
        regionCode,
        yearMonth,
      };
    }

    // 2. 캐시 미스 → 공공API 호출
    this.logger.log(`Cache miss: ${regionCode}/${yearMonth}, fetching from API`);
    const trades = await this.fetchFromApi(regionCode, yearMonth);

    // 3. DB에 캐시 저장
    if (trades.length > 0) {
      try {
        const existing = await this.cacheRepo.findOne({
          where: { regionCode, dealType, yearMonth },
        });
        if (existing) {
          existing.data = trades as unknown as Record<string, unknown>;
          existing.fetchedAt = new Date();
          await this.cacheRepo.save(existing);
        } else {
          const entity = this.cacheRepo.create({
            regionCode,
            dealType,
            yearMonth,
            data: trades as unknown as Record<string, unknown>,
          });
          await this.cacheRepo.save(entity);
        }
      } catch (err) {
        this.logger.error(
          `Failed to cache: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const filtered = this.filterByArea(trades, minArea, maxArea);
    return {
      trades: filtered,
      totalCount: filtered.length,
      cached: false,
      regionCode,
      yearMonth,
    };
  }

  async searchRange(regionCode: string, fromMonth: string, toMonth: string) {
    const months = this.generateMonthRange(fromMonth, toMonth);
    const results = await Promise.all(
      months.map((m) => this.search(regionCode, m)),
    );

    const monthly: MonthlyPriceSummary[] = results.map((r) => {
      const prices = r.trades
        .map((t) => parseInt(t.dealAmount?.replace(/,/g, "").trim() || "0", 10))
        .filter((p) => p > 0);

      const avg =
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0;
      const min = prices.length > 0 ? Math.min(...prices) : 0;
      const max = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        yearMonth: r.yearMonth,
        avgPrice: avg,
        minPrice: min,
        maxPrice: max,
        tradeCount: prices.length,
      };
    });

    return {
      regionCode,
      fromMonth,
      toMonth,
      monthly,
    };
  }

  private filterByArea(
    trades: RealPriceTrade[],
    minArea?: number,
    maxArea?: number,
  ): RealPriceTrade[] {
    if (minArea === undefined && maxArea === undefined) {
      return trades;
    }
    return trades.filter((trade) => {
      const area = parseFloat(String(trade.excluUseAr ?? "0"));
      if (isNaN(area)) return false;
      if (minArea !== undefined && area < minArea) return false;
      if (maxArea !== undefined && area > maxArea) return false;
      return true;
    });
  }

  private generateMonthRange(from: string, to: string): string[] {
    const months: string[] = [];
    let year = parseInt(from.slice(0, 4), 10);
    let month = parseInt(from.slice(4, 6), 10);
    const toYear = parseInt(to.slice(0, 4), 10);
    const toMonth = parseInt(to.slice(4, 6), 10);

    while (year < toYear || (year === toYear && month <= toMonth)) {
      months.push(`${year}${String(month).padStart(2, "0")}`);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    return months;
  }

  private async fetchFromApi(
    regionCode: string,
    yearMonth: string,
  ): Promise<RealPriceTrade[]> {
    const serviceKey = this.config.get<string>("DATA_GO_KR_API_KEY");
    if (!serviceKey) {
      this.logger.error("DATA_GO_KR_API_KEY is not configured");
      return [];
    }

    // data.go.kr 키는 Encoding/Decoding 두 형식이 있음. URLSearchParams 가
    // 재인코딩 하므로 디코딩된 형태를 넘겨야 한 번만 인코딩 됨.
    // (decode 가 이미 디코딩된 키에는 무영향이라 양쪽 형식 모두 안전)
    let key = serviceKey;
    try { key = decodeURIComponent(serviceKey); } catch { /* keep raw */ }

    const params = new URLSearchParams({
      serviceKey: key,
      LAWD_CD: regionCode,
      DEAL_YMD: yearMonth,
      pageNo: "1",
      numOfRows: "100",
      type: "json",
    });

    try {
      const res = await fetch(`${this.apiBase}?${params.toString()}`);

      const text = await res.text();

      if (!res.ok) {
        this.logger.error(
          `API responded with status ${res.status} | url=${this.apiBase} | body=${text.slice(0, 300)}`,
        );
        return [];
      }

      // data.go.kr 는 정상 응답엔 JSON, 에러엔 XML 을 반환할 수 있음.
      // XML 이면 `<returnAuthMsg>` / `<returnReasonCode>` 추출해 로깅.
      if (text.trimStart().startsWith("<")) {
        const reason =
          /<returnReasonCode>([^<]+)<\/returnReasonCode>/.exec(text)?.[1] ??
          "";
        const authMsg =
          /<returnAuthMsg>([^<]+)<\/returnAuthMsg>/.exec(text)?.[1] ?? "";
        const errMsg = /<errMsg>([^<]+)<\/errMsg>/.exec(text)?.[1] ?? "";
        // 표준 cmmMsgHeader 가 아닌 XML/HTML 응답일 경우 원본도 같이 남겨야
        // 디버깅 가능 (예: WAF/HTML 에러 페이지)
        const rawHint =
          !reason && !authMsg && !errMsg
            ? ` | raw=${text.replace(/\s+/g, " ").slice(0, 300)}`
            : "";
        this.logger.error(
          `data.go.kr XML error | code=${reason} | auth=${authMsg} | err=${errMsg} | url=${this.apiBase}${rawHint}`,
        );
        return [];
      }

      const data = JSON.parse(text);
      const items =
        data?.response?.body?.items?.item ??
        data?.body?.items?.item ??
        [];

      if (!items) return [];
      return Array.isArray(items) ? items : [items];
    } catch (err) {
      this.logger.error(
        `API fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }
}
