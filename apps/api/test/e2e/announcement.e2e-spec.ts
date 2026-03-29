import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AnnouncementController } from "@/announcement/announcement.controller";
import { AnnouncementService } from "@/announcement/announcement.service";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Announcement, SubscriptionCriteria } from "@zipath/db";

const mockAnnouncements = [
  {
    id: 1,
    title: "테스트 아파트",
    organization: "123-456",
    region: "서울",
    supplyType: "공공분양",
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-03-15"),
    detailUrl: "https://example.com",
    summary: "테스트 아파트 | 서울 | 총 100세대",
    rawData: {},
  },
];

const createQueryBuilder = {
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([mockAnnouncements, 1]),
};

const mockAnnouncementRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder),
  findOne: jest.fn().mockImplementation(({ where }: { where: { id: number } }) => {
    if (where.id === 1) return Promise.resolve(mockAnnouncements[0]);
    return Promise.resolve(null);
  }),
  create: jest.fn(),
  save: jest.fn(),
};

const mockCriteriaRepo = {
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  }),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue("test-api-key"),
};

describe("AnnouncementController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AnnouncementController],
      providers: [
        AnnouncementService,
        { provide: getRepositoryToken(Announcement), useValue: mockAnnouncementRepo },
        { provide: getRepositoryToken(SubscriptionCriteria), useValue: mockCriteriaRepo },
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

  describe("GET /api/announcements", () => {
    it("공고 목록을 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/announcements")
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.totalCount).toBe(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
      expect(res.body.items[0].title).toBe("테스트 아파트");
    });

    it("페이지네이션이 동작한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/announcements?page=1&limit=5")
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });

    it("지역 필터가 동작한다", async () => {
      await request(app.getHttpServer())
        .get("/api/announcements?region=서울")
        .expect(200);

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith(
        "a.region = :region",
        { region: "서울" },
      );
    });
  });

  describe("GET /api/announcements/:id", () => {
    it("존재하는 공고를 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/announcements/1")
        .expect(200);

      expect(res.body.title).toBe("테스트 아파트");
      expect(res.body.region).toBe("서울");
    });

    it("존재하지 않는 공고에 404를 반환한다", async () => {
      await request(app.getHttpServer())
        .get("/api/announcements/999")
        .expect(404);
    });

    it("ID가 숫자가 아니면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .get("/api/announcements/abc")
        .expect(400);
    });
  });
});
