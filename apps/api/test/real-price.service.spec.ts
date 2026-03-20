import { RealPriceService } from "../src/real-price/real-price.service";
import { RealPriceCache } from "@zipath/db";
import type { RealPriceTrade } from "@zipath/types";

interface MockRepository {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

interface MockConfigService {
  get: jest.Mock;
}

/** Helper: 실거래 데이터 생성 */
function makeTrade(overrides: Partial<RealPriceTrade> = {}): RealPriceTrade {
  return {
    aptNm: "테스트아파트",
    dealAmount: " 50,000",
    buildYear: "2020",
    dealYear: "2026",
    dealMonth: "03",
    dealDay: "15",
    excluUseAr: "84.99",
    floor: "10",
    umdNm: "역삼동",
    jibun: "123-4",
    roadNm: "테헤란로",
    ...overrides,
  };
}

/** Helper: 캐시 엔티티 생성 */
function makeCacheEntity(
  trades: RealPriceTrade[],
  overrides: Partial<RealPriceCache> = {},
): RealPriceCache {
  return {
    id: 1,
    regionCode: "11680",
    dealType: "매매",
    yearMonth: "202603",
    data: trades as unknown as Record<string, unknown>,
    fetchedAt: new Date(),
    ...overrides,
  };
}

// global fetch 모킹
const originalFetch = global.fetch;

describe("RealPriceService", () => {
  let service: RealPriceService;
  let cacheRepo: MockRepository;
  let configService: MockConfigService;

  beforeEach(() => {
    cacheRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    service = new RealPriceService(
      cacheRepo as never,
      configService as never,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ----- search (cache hit) -----
  describe("search - cache hit", () => {
    it("should return cached data when available", async () => {
      const trades = [makeTrade(), makeTrade({ aptNm: "두번째아파트" })];
      const cached = makeCacheEntity(trades);
      cacheRepo.findOne.mockResolvedValue(cached);

      const result = await service.search("11680", "202603");

      expect(result.cached).toBe(true);
      expect(result.trades).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.regionCode).toBe("11680");
      expect(result.yearMonth).toBe("202603");
    });
  });

  // ----- search (cache miss → API) -----
  describe("search - cache miss", () => {
    it("should fetch from API when no cache", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue("test-api-key");

      const apiTrades = [makeTrade()];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: { body: { items: { item: apiTrades } } },
        }),
      });

      cacheRepo.create.mockReturnValue(makeCacheEntity(apiTrades));
      cacheRepo.save.mockResolvedValue(makeCacheEntity(apiTrades));

      const result = await service.search("11680", "202603");

      expect(result.cached).toBe(false);
      expect(result.trades).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should return empty trades when API key is missing", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue(undefined);

      const result = await service.search("11680", "202603");

      expect(result.trades).toHaveLength(0);
      expect(result.cached).toBe(false);
    });

    it("should return empty trades when API responds with error", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue("test-api-key");

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.search("11680", "202603");

      expect(result.trades).toHaveLength(0);
    });

    it("should return empty trades when fetch throws", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue("test-api-key");

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await service.search("11680", "202603");

      expect(result.trades).toHaveLength(0);
    });

    it("should handle single item response (non-array)", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue("test-api-key");

      const singleTrade = makeTrade();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: { body: { items: { item: singleTrade } } },
        }),
      });

      cacheRepo.create.mockReturnValue(makeCacheEntity([singleTrade]));
      cacheRepo.save.mockResolvedValue(makeCacheEntity([singleTrade]));

      const result = await service.search("11680", "202603");

      expect(result.trades).toHaveLength(1);
    });

    it("should save cache after successful API fetch", async () => {
      // First findOne for cache check returns null, second for save check also null
      cacheRepo.findOne
        .mockResolvedValueOnce(null) // initial cache check
        .mockResolvedValueOnce(null); // save check
      configService.get.mockReturnValue("test-api-key");

      const trades = [makeTrade()];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: { body: { items: { item: trades } } },
        }),
      });

      const entity = makeCacheEntity(trades);
      cacheRepo.create.mockReturnValue(entity);
      cacheRepo.save.mockResolvedValue(entity);

      await service.search("11680", "202603");

      expect(cacheRepo.create).toHaveBeenCalled();
      expect(cacheRepo.save).toHaveBeenCalled();
    });

    it("should not save cache when API returns empty results", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue("test-api-key");

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: { body: { items: { item: [] } } },
        }),
      });

      await service.search("11680", "202603");

      expect(cacheRepo.create).not.toHaveBeenCalled();
    });
  });

  // ----- searchRange -----
  describe("searchRange", () => {
    it("should aggregate monthly data across range", async () => {
      const trade1 = makeTrade({ dealAmount: " 50,000" });
      const trade2 = makeTrade({ dealAmount: " 60,000" });

      // 2 months: 202601, 202602
      cacheRepo.findOne
        .mockResolvedValueOnce(makeCacheEntity([trade1], { yearMonth: "202601" }))
        .mockResolvedValueOnce(makeCacheEntity([trade2], { yearMonth: "202602" }));

      const result = await service.searchRange("11680", "202601", "202602");

      expect(result.regionCode).toBe("11680");
      expect(result.fromMonth).toBe("202601");
      expect(result.toMonth).toBe("202602");
      expect(result.monthly).toHaveLength(2);
    });

    it("should calculate avg/min/max correctly", async () => {
      const trades = [
        makeTrade({ dealAmount: " 30,000" }),
        makeTrade({ dealAmount: " 50,000" }),
        makeTrade({ dealAmount: " 40,000" }),
      ];
      cacheRepo.findOne.mockResolvedValue(makeCacheEntity(trades));

      const result = await service.searchRange("11680", "202603", "202603");

      expect(result.monthly).toHaveLength(1);
      const month = result.monthly[0];
      expect(month.avgPrice).toBe(40000);
      expect(month.minPrice).toBe(30000);
      expect(month.maxPrice).toBe(50000);
      expect(month.tradeCount).toBe(3);
    });

    it("should handle month with no trades", async () => {
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue(undefined); // no API key → empty trades

      const result = await service.searchRange("11680", "202603", "202603");

      expect(result.monthly).toHaveLength(1);
      const month = result.monthly[0];
      expect(month.avgPrice).toBe(0);
      expect(month.minPrice).toBe(0);
      expect(month.maxPrice).toBe(0);
      expect(month.tradeCount).toBe(0);
    });

    it("should generate correct month range across year boundary", async () => {
      // 202611 ~ 202602 should produce 4 months: 11, 12, 01, 02
      cacheRepo.findOne.mockResolvedValue(null);
      configService.get.mockReturnValue(undefined);

      const result = await service.searchRange("11680", "202511", "202602");

      expect(result.monthly).toHaveLength(4);
    });
  });
});
