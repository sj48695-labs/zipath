import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { RealPriceController } from "@/real-price/real-price.controller";
import { RealPriceService } from "@/real-price/real-price.service";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { RealPriceCache } from "@zipath/db";

const mockCacheRepo = {
  findOne: jest.fn().mockResolvedValue({
    regionCode: "11110",
    dealType: "매매",
    yearMonth: "202601",
    data: [
      { aptNm: "테스트아파트", dealAmount: "50,000", dealYear: "2026", dealMonth: "01" },
    ],
  }),
  create: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue("test-api-key"),
};

describe("RealPriceController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [RealPriceController],
      providers: [
        RealPriceService,
        { provide: getRepositoryToken(RealPriceCache), useValue: mockCacheRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/real-price/search", () => {
    it("캐시된 실거래가 데이터를 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/real-price/search?regionCode=11110&yearMonth=202601")
        .expect(200);

      expect(res.body.trades).toBeDefined();
      expect(res.body.totalCount).toBe(1);
      expect(res.body.cached).toBe(true);
      expect(res.body.regionCode).toBe("11110");
      expect(res.body.yearMonth).toBe("202601");
    });

    it("regionCode가 없으면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .get("/api/real-price/search?yearMonth=202601")
        .expect(400);
    });

    it("yearMonth 형식이 잘못되면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .get("/api/real-price/search?regionCode=11110&yearMonth=2026-01")
        .expect(400);
    });

    it("regionCode 길이가 5자리가 아니면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .get("/api/real-price/search?regionCode=111&yearMonth=202601")
        .expect(400);
    });
  });
});
