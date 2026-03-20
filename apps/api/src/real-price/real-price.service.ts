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

    const params = new URLSearchParams({
      serviceKey,
      LAWD_CD: regionCode,
      DEAL_YMD: yearMonth,
      pageNo: "1",
      numOfRows: "100",
      type: "json",
    });

    try {
      const res = await fetch(`${this.apiBase}?${params.toString()}`);

      if (!res.ok) {
        this.logger.error(`API responded with status ${res.status}`);
        return [];
      }

      const data = await res.json();
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
