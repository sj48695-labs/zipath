import { BadRequestException } from "@nestjs/common";
import { RealPriceController } from "@/real-price/real-price.controller";

const mockRealPriceService = {
  search: jest.fn().mockResolvedValue({
    trades: [
      {
        aptNm: "소형",
        dealAmount: "30,000",
        excluUseAr: "59",
        dealYear: "2026",
        dealMonth: "01",
      },
      {
        aptNm: "중형",
        dealAmount: "50,000",
        excluUseAr: "84",
        dealYear: "2026",
        dealMonth: "01",
      },
      {
        aptNm: "대형",
        dealAmount: "80,000",
        excluUseAr: "120",
        dealYear: "2026",
        dealMonth: "01",
      },
    ],
    totalCount: 3,
    cached: true,
    regionCode: "11110",
    yearMonth: "202601",
  }),
  searchRange: jest.fn().mockResolvedValue({
    regionCode: "11110",
    fromMonth: "202601",
    toMonth: "202603",
    monthly: [],
  }),
};

describe("RealPriceController (e2e)", () => {
  const controller = new RealPriceController(mockRealPriceService as never);

  describe("GET /api/real-price/search", () => {
    it("캐시된 실거래가 데이터를 반환한다", async () => {
      const res = await controller.search("11110", "202601");

      expect(res.trades).toBeDefined();
      expect(res.totalCount).toBe(3);
      expect(res.cached).toBe(true);
      expect(res.regionCode).toBe("11110");
      expect(res.yearMonth).toBe("202601");
    });

    it("regionCode가 없으면 400을 반환한다", async () => {
      await expect(
        controller.search("" as never, "202601"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("yearMonth 형식이 잘못되면 400을 반환한다", async () => {
      await expect(
        controller.search("11110", "2026-01"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("regionCode 길이가 5자리가 아니면 400을 반환한다", async () => {
      await expect(
        controller.search("111" as never, "202601"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("minArea가 음수이면 400을 반환한다", async () => {
      await expect(
        controller.search("11110", "202601", "-1"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("maxArea가 음수이면 400을 반환한다", async () => {
      await expect(
        controller.search("11110", "202601", undefined, "-5"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("minArea/maxArea 로 평형 필터를 적용한다", async () => {
      const res = await controller.search("11110", "202601", "60", "85");

      expect(mockRealPriceService.search).toHaveBeenCalledWith(
        "11110",
        "202601",
        60,
        85,
      );
      expect(res.trades).toHaveLength(3);
      expect(res.totalCount).toBe(3);
      expect(res.cached).toBe(true);
    });

    it("필터 미지정 호출은 기존 동작과 동일하다", async () => {
      const res = await controller.search("11110", "202601");

      expect(res.trades).toHaveLength(3);
      expect(res.totalCount).toBe(3);
    });
  });

  describe("GET /api/real-price/trend", () => {
    it("기간별 평균 가격을 반환한다", async () => {
      const res = await controller.trend("11110", "202601", "202603");

      expect(mockRealPriceService.searchRange).toHaveBeenCalledWith(
        "11110",
        "202601",
        "202603",
      );
      expect(res.regionCode).toBe("11110");
      expect(res.fromMonth).toBe("202601");
      expect(res.toMonth).toBe("202603");
    });

    it("잘못된 기간 형식이면 400을 반환한다", async () => {
      await expect(
        controller.trend("11110", "2026-01", "202603"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
