import { BadGatewayException } from "@nestjs/common";
import { AnnouncementService } from "../src/announcement/announcement.service";
import { Announcement, SubscriptionCriteria } from "@zipath/db";
import type { MatchRequestDto } from "../src/announcement/dto/match-request.dto";

/** Helper: 최소한의 Announcement 엔티티 생성 */
function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 1,
    title: "테스트 공고",
    organization: "LH",
    region: "서울",
    supplyType: "공공분양",
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-03-31"),
    detailUrl: null,
    summary: null,
    rawData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Helper: 최소한의 SubscriptionCriteria 엔티티 생성 */
function makeCriteria(
  overrides: Partial<SubscriptionCriteria> = {},
): SubscriptionCriteria {
  return {
    id: 1,
    type: "1순위",
    minAge: 19,
    maxIncome: 6000,
    minHomeless: 24,
    region: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// --- 모킹 타입 ---
interface MockQueryBuilder {
  orderBy: jest.Mock;
  andWhere: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
  where: jest.Mock;
  getMany: jest.Mock;
  select: jest.Mock;
  getRawOne: jest.Mock;
}

interface MockRepository {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

interface MockConfigService {
  get: jest.Mock;
}

function createMockQueryBuilder(
  overrides: Partial<MockQueryBuilder> = {},
): MockQueryBuilder {
  const qb: MockQueryBuilder = {
    orderBy: jest.fn(),
    andWhere: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    where: jest.fn(),
    getMany: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue(undefined),
  };
  qb.orderBy.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  Object.assign(qb, overrides);
  return qb;
}

describe("AnnouncementService", () => {
  let service: AnnouncementService;
  let announcementRepo: MockRepository;
  let criteriaRepo: MockRepository;
  let configService: MockConfigService;

  beforeEach(() => {
    announcementRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    criteriaRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    service = new AnnouncementService(
      announcementRepo as never,
      criteriaRepo as never,
      configService as never,
    );
  });

  // ----- findAll -----
  describe("findAll", () => {
    it("should return paginated items from DB", async () => {
      const announcement = makeAnnouncement();
      const syncedAt = new Date("2026-06-01T03:00:00.000Z");
      const qb = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([[announcement], 1]),
        getRawOne: jest.fn().mockResolvedValue({ max: syncedAt }),
      });
      announcementRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1, 10);

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("테스트 공고");
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should include lastSyncedAt as ISO string when data exists", async () => {
      const announcement = makeAnnouncement();
      const syncedAt = new Date("2026-06-01T03:00:00.000Z");
      const qb = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([[announcement], 1]),
        getRawOne: jest.fn().mockResolvedValue({ max: syncedAt }),
      });
      announcementRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1, 10);

      expect(result.lastSyncedAt).toBe(syncedAt.toISOString());
    });

    it("should return lastSyncedAt as null when no data exists", async () => {
      const qb = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawOne: jest.fn().mockResolvedValue({ max: null }),
      });
      announcementRepo.createQueryBuilder.mockReturnValue(qb);
      configService.get.mockReturnValue(undefined); // syncFromApi에서 key 없으면 return

      const result = await service.findAll(1, 10);

      expect(result.lastSyncedAt).toBeNull();
    });

    it("should apply region filter when provided", async () => {
      const qb = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      });
      announcementRepo.createQueryBuilder.mockReturnValue(qb);
      configService.get.mockReturnValue(undefined); // syncFromApi에서 key 없으면 return

      await service.findAll(1, 10, "서울");

      expect(qb.andWhere).toHaveBeenCalledWith("a.region = :region", {
        region: "서울",
      });
    });
  });

  // ----- findOne -----
  describe("findOne", () => {
    it("should return dto when found", async () => {
      const announcement = makeAnnouncement();
      announcementRepo.findOne.mockResolvedValue(announcement);

      const result = await service.findOne(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.title).toBe("테스트 공고");
    });

    it("should return null when not found", async () => {
      announcementRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  // ----- syncFromApi -----
  describe("syncFromApi", () => {
    it("should throw BadGatewayException when upstream API responds with an error", async () => {
      configService.get.mockReturnValue("test-api-key");
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: jest.fn().mockResolvedValue("Bad Gateway"),
      });

      await expect(service.syncFromApi()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  // ----- matchAnnouncement -----
  describe("matchAnnouncement", () => {
    const baseInput: MatchRequestDto = {
      age: 30,
      income: 5000,
      homelessMonths: 36,
    };

    it("should return null when announcement not found", async () => {
      announcementRepo.findOne.mockResolvedValue(null);

      const result = await service.matchAnnouncement(999, baseInput);

      expect(result).toBeNull();
    });

    describe("with DB criteria", () => {
      it("should return eligible when all criteria met", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const criteria = makeCriteria({
          type: "1순위",
          minAge: 19,
          maxIncome: 6000,
          minHomeless: 24,
        });
        const qb = createMockQueryBuilder({
          getMany: jest.fn().mockResolvedValue([criteria]),
        });
        criteriaRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.matchAnnouncement(1, baseInput);

        expect(result).not.toBeNull();
        expect(result!.overallEligible).toBe(true);
        expect(result!.results[0].eligible).toBe(true);
        expect(result!.results[0].reason).toContain("충족");
      });

      it("should return ineligible when age is too low", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const criteria = makeCriteria({ minAge: 25 });
        const qb = createMockQueryBuilder({
          getMany: jest.fn().mockResolvedValue([criteria]),
        });
        criteriaRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          age: 20,
        });

        expect(result!.overallEligible).toBe(false);
        expect(result!.results[0].reason).toContain("나이");
      });

      it("should return ineligible when income exceeds limit", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const criteria = makeCriteria({ maxIncome: 5000 });
        const qb = createMockQueryBuilder({
          getMany: jest.fn().mockResolvedValue([criteria]),
        });
        criteriaRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          income: 7000,
        });

        expect(result!.overallEligible).toBe(false);
        expect(result!.results[0].reason).toContain("소득");
      });

      it("should return ineligible when homeless months insufficient", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const criteria = makeCriteria({ minHomeless: 36 });
        const qb = createMockQueryBuilder({
          getMany: jest.fn().mockResolvedValue([criteria]),
        });
        criteriaRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          homelessMonths: 12,
        });

        expect(result!.overallEligible).toBe(false);
        expect(result!.results[0].reason).toContain("무주택");
      });

      it("should return ineligible when region mismatches", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const criteria = makeCriteria({ region: "서울" });
        const qb = createMockQueryBuilder({
          getMany: jest.fn().mockResolvedValue([criteria]),
        });
        criteriaRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          region: "부산",
        });

        expect(result!.overallEligible).toBe(false);
        expect(result!.results[0].reason).toContain("지역");
      });
    });

    describe("with default criteria (no DB criteria)", () => {
      beforeEach(() => {
        const qb = createMockQueryBuilder({
          getMany: jest.fn().mockResolvedValue([]),
        });
        criteriaRepo.createQueryBuilder.mockReturnValue(qb);
      });

      it("should return eligible for 1순위 when all conditions met", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, baseInput);

        expect(result!.overallEligible).toBe(true);
        const first = result!.results.find((r) => r.criterion === "1순위 일반");
        expect(first).toBeDefined();
        expect(first!.eligible).toBe(true);
      });

      it("should return ineligible for 1순위 when under 19", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          age: 18,
          homelessMonths: 12,
          income: 7000,
        });

        const first = result!.results.find((r) => r.criterion === "1순위 일반");
        expect(first!.eligible).toBe(false);
      });

      it("should include 특별공급 (신혼부부) when married and income <= 7000", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          income: 7000,
          isMarried: true,
        });

        const newlywed = result!.results.find((r) =>
          r.criterion.includes("신혼부부"),
        );
        expect(newlywed).toBeDefined();
        expect(newlywed!.eligible).toBe(true);
      });

      it("should include 특별공급 (생애최초) when isFirstHome and income <= 6000", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          isFirstHome: true,
        });

        const firstLife = result!.results.find((r) =>
          r.criterion.includes("생애최초"),
        );
        expect(firstLife).toBeDefined();
        expect(firstLife!.eligible).toBe(true);
      });

      it("should flag region mismatch in default criteria", async () => {
        const announcement = makeAnnouncement({ region: "서울" });
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, {
          ...baseInput,
          region: "부산",
        });

        const first = result!.results.find((r) => r.criterion === "1순위 일반");
        expect(first!.eligible).toBe(false);
        expect(first!.reason).toContain("지역");
      });

      it("should return positive message when eligible", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, baseInput);

        expect(result!.message).toContain("지원 가능한");
      });

      it("should return negative message when all ineligible", async () => {
        const announcement = makeAnnouncement();
        announcementRepo.findOne.mockResolvedValue(announcement);

        const result = await service.matchAnnouncement(1, {
          age: 15,
          income: 10000,
          homelessMonths: 0,
          region: "부산",
        });

        expect(result!.message).toContain("어렵습니다");
      });
    });
  });

  // ----- matchAllAnnouncements -----
  describe("matchAllAnnouncements", () => {
    const baseInput: MatchRequestDto = {
      age: 30,
      income: 5000,
      homelessMonths: 36,
    };

    /** 활성 공고 조회 + 단일 매칭에 쓰이는 criteria QB 모킹 헬퍼 */
    function setupRepos(
      activeAnnouncements: Announcement[],
      criteria: SubscriptionCriteria[] = [],
    ) {
      const listQb = createMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(activeAnnouncements),
      });
      announcementRepo.createQueryBuilder.mockReturnValue(listQb);
      announcementRepo.findOne.mockImplementation(
        ({ where }: { where: { id: number } }) =>
          Promise.resolve(
            activeAnnouncements.find((a) => a.id === where.id) ?? null,
          ),
      );
      const criteriaQb = createMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(criteria),
      });
      criteriaRepo.createQueryBuilder.mockReturnValue(criteriaQb);
      return { listQb };
    }

    it("should only query announcements that are not past deadline", async () => {
      const { listQb } = setupRepos([]);

      await service.matchAllAnnouncements(baseInput);

      expect(listQb.where).toHaveBeenCalledWith(
        "a.endDate >= :now",
        expect.objectContaining({ now: expect.any(Date) }),
      );
    });

    it("should only return eligible announcements", async () => {
      const eligible = makeAnnouncement({ id: 1, region: "서울" });
      const ineligible = makeAnnouncement({ id: 2, region: "부산" });
      // 입력 region=서울 이면 부산 공고는 default criteria 에서 모두 부적격
      setupRepos([eligible, ineligible]);

      const result = await service.matchAllAnnouncements({
        ...baseInput,
        region: "서울",
      });

      expect(result.matchedCount).toBe(1);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].announcementId).toBe(1);
      expect(result.matches.every((m) => m.overallEligible)).toBe(true);
    });

    it("should keep matchedCount in sync with matches length", async () => {
      const a1 = makeAnnouncement({ id: 1 });
      const a2 = makeAnnouncement({ id: 2 });
      setupRepos([a1, a2]);

      const result = await service.matchAllAnnouncements(baseInput);

      expect(result.matchedCount).toBe(result.matches.length);
    });

    it("should return empty result when no announcements match", async () => {
      const a1 = makeAnnouncement({ id: 1, region: "서울" });
      setupRepos([a1]);

      const result = await service.matchAllAnnouncements({
        age: 15,
        income: 10000,
        homelessMonths: 0,
        region: "부산",
      });

      expect(result.matchedCount).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it("should return empty result when there are no active announcements", async () => {
      setupRepos([]);

      const result = await service.matchAllAnnouncements(baseInput);

      expect(result.matchedCount).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it("should include the legal disclaimer", async () => {
      setupRepos([]);

      const result = await service.matchAllAnnouncements(baseInput);

      expect(result.disclaimer).toContain("법적 효력");
    });
  });
});
