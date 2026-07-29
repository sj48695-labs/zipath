import {
  ArgumentMetadata,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
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
    endDate: new Date("2099-03-15"),
    detailUrl: "https://example.com",
    summary: "테스트 아파트 | 서울 | 총 100세대",
    rawData: {},
  },
];

const createQueryBuilder = {
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([mockAnnouncements, 1]),
  getMany: jest.fn().mockResolvedValue(mockAnnouncements),
  getRawOne: jest.fn().mockResolvedValue({ max: new Date("2026-03-01") }),
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
  let controller: AnnouncementController;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AnnouncementController],
      providers: [
        AnnouncementService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: mockAnnouncementRepo,
        },
        {
          provide: getRepositoryToken(SubscriptionCriteria),
          useValue: mockCriteriaRepo,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = moduleFixture.get(AnnouncementController);
  });

  describe("GET /api/announcements", () => {
    it("공고 목록을 반환한다", async () => {
      const res = await controller.findAll();

      expect(res.items).toBeDefined();
      expect(res.totalCount).toBe(1);
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.items[0].title).toBe("테스트 아파트");
      expect(res.lastSyncedAt).toBeDefined();
      expect(typeof res.lastSyncedAt).toBe("string");
    });

    it("페이지네이션이 동작한다", async () => {
      const res = await controller.findAll("1", "5");

      expect(res.page).toBe(1);
      expect(res.limit).toBe(5);
    });

    it("지역 필터가 동작한다", async () => {
      await controller.findAll(undefined, undefined, "서울");

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith(
        "a.region = :region",
        { region: "서울" },
      );
    });
  });

  describe("GET /api/announcements/:id", () => {
    it("존재하는 공고를 반환한다", async () => {
      const res = await controller.findOne(1);

      expect(res).not.toBeNull();
      expect(res!.title).toBe("테스트 아파트");
      expect(res!.region).toBe("서울");
    });

    it("존재하지 않는 공고에 404를 반환한다", async () => {
      await expect(controller.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("ID가 숫자가 아니면 400을 반환한다", async () => {
      const pipe = new ParseIntPipe();
      const metadata: ArgumentMetadata = {
        type: "param",
        metatype: Number,
        data: "id",
      };

      await expect(pipe.transform("abc", metadata)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("POST /api/announcements/match", () => {
    it("사용자 조건으로 전체 공고를 자동 매칭한다", async () => {
      const res = await controller.matchAll({
        age: 30,
        income: 5000,
        homelessMonths: 36,
        region: "서울",
      });

      expect(res.matchedCount).toBe(res.matches.length);
      expect(Array.isArray(res.matches)).toBe(true);
      expect(res.matchedCount).toBeGreaterThan(0);
      expect(res.matches[0].overallEligible).toBe(true);
      expect(res.disclaimer).toContain("법적 효력");
    });

    it("필수 입력(age)이 없으면 400을 반환한다", async () => {
      await expect(
        controller.matchAll({
          income: 5000,
          homelessMonths: 36,
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("POST /api/announcements/:id/match", () => {
    it("존재하는 공고를 사용자 조건과 매칭한다", async () => {
      const res = await controller.matchAnnouncement(1, {
        age: 30,
        income: 5000,
        homelessMonths: 36,
        region: "서울",
      });

      expect(res).not.toBeNull();
      expect(res!.announcementId).toBe(1);
      expect(res!.overallEligible).toBe(true);
      expect(res!.results.length).toBeGreaterThan(0);
      expect(res!.message).toContain("지원 가능한");
    });

    it("존재하지 않는 공고에 404를 반환한다", async () => {
      await expect(
        controller.matchAnnouncement(999, {
          age: 30,
          income: 5000,
          homelessMonths: 36,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("잘못된 body는 400을 반환한다", async () => {
      await expect(
        controller.matchAnnouncement(1, {
          income: 5000,
          homelessMonths: 36,
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
