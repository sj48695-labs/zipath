import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RealPriceCache } from "@zipath/db";
import type { RealPriceTrade } from "@zipath/types";

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

  async search(regionCode: string, yearMonth: string) {
    const dealType = "매매";

    // 1. DB 캐시 확인
    const cached = await this.cacheRepo.findOne({
      where: { regionCode, dealType, yearMonth },
    });

    if (cached) {
      this.logger.log(`Cache hit: ${regionCode}/${yearMonth}`);
      const trades = cached.data as unknown as RealPriceTrade[];
      return {
        trades,
        totalCount: trades.length,
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

    return {
      trades,
      totalCount: trades.length,
      cached: false,
      regionCode,
      yearMonth,
    };
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
