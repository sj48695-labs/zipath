import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ChecklistController } from "@/checklist/checklist.controller";
import { ChecklistService } from "@/checklist/checklist.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ChecklistTemplate, ChecklistItem } from "@zipath/db";

const mockTemplateRepo = {
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((entity) => ({ id: 1, ...entity })),
  findOne: jest.fn().mockResolvedValue(null),
};

const mockItemRepo = {
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockResolvedValue([]),
};

describe("ChecklistController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [ChecklistController],
      providers: [
        ChecklistService,
        { provide: getRepositoryToken(ChecklistTemplate), useValue: mockTemplateRepo },
        { provide: getRepositoryToken(ChecklistItem), useValue: mockItemRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/checklist/:type", () => {
    it("월세 체크리스트를 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/checklist/rent")
        .expect(200);

      expect(res.body.title).toBe("월세 계약 체크리스트");
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThan(0);

      const item = res.body.items[0];
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("content");
      expect(item).toHaveProperty("isRequired");
    });

    it("전세 체크리스트를 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/checklist/jeonse")
        .expect(200);

      expect(res.body.title).toBe("전세 계약 체크리스트");
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it("매매 체크리스트를 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/checklist/buy")
        .expect(200);

      expect(res.body.title).toBe("매매 계약 체크리스트");
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it("존재하지 않는 타입이면 404를 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/checklist/invalid")
        .expect(404);

      expect(res.body.message).toContain("찾을 수 없습니다");
    });
  });
});
