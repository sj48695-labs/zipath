import { NotificationSchedulerService } from "../src/notification/notification-scheduler.service";
import {
  Announcement,
  Notification,
  NotificationPreference,
  RealPriceCache,
} from "@zipath/db";

interface MockRepo<T = unknown> {
  find: jest.Mock<Promise<T[]>, [unknown?]>;
  findOne: jest.Mock<Promise<T | null>, [unknown]>;
  count: jest.Mock<Promise<number>, [unknown]>;
  create: jest.Mock<Partial<T>, [Partial<T>]>;
  save: jest.Mock<Promise<T>, [Partial<T>]>;
}

function createRepo<T>(): MockRepo<T> {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((dto: Partial<T>) => dto),
    save: jest.fn(async (dto: Partial<T>) => dto as T),
  };
}

function makePref(
  overrides: Partial<NotificationPreference> = {},
): NotificationPreference {
  return {
    id: 1,
    userId: 10,
    regions: ["서울 강남구"],
    priceThresholdMin: null,
    priceThresholdMax: null,
    announcementKeywords: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as NotificationPreference;
}

function makeCache(
  overrides: Partial<RealPriceCache> & { avg: number },
): RealPriceCache {
  // dealAmount 1건만 두어 avg = dealAmount 가 되도록 구성
  const { avg, ...rest } = overrides;
  const dealAmount = avg.toLocaleString();
  return {
    id: Math.floor(Math.random() * 1_000_000),
    regionCode: "서울 강남구",
    dealType: "매매",
    yearMonth: "202605",
    data: [{ dealAmount }] as unknown as Record<string, unknown>,
    fetchedAt: new Date(),
    ...rest,
  } as RealPriceCache;
}

function makeAnnouncement(
  overrides: Partial<Announcement> = {},
): Announcement {
  return {
    id: 1,
    title: "신혼부부 특별공급 공고",
    organization: "LH",
    region: "서울 강남구",
    supplyType: "공공분양",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    detailUrl: null,
    summary: null,
    rawData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Announcement;
}

describe("NotificationSchedulerService", () => {
  let service: NotificationSchedulerService;
  let prefRepo: MockRepo<NotificationPreference>;
  let cacheRepo: MockRepo<RealPriceCache>;
  let announcementRepo: MockRepo<Announcement>;
  let notificationRepo: MockRepo<Notification>;

  beforeEach(() => {
    prefRepo = createRepo<NotificationPreference>();
    cacheRepo = createRepo<RealPriceCache>();
    announcementRepo = createRepo<Announcement>();
    notificationRepo = createRepo<Notification>();

    service = new NotificationSchedulerService(
      prefRepo as never,
      cacheRepo as never,
      announcementRepo as never,
      notificationRepo as never,
    );
  });

  // ----- detectPriceChange -----
  describe("detectPriceChange", () => {
    it("가격 변동 5%↑ 시 알림 1건 생성 (type=price_change, referenceId 포함)", async () => {
      prefRepo.find.mockResolvedValue([makePref()]);
      // 최신 2개: 이전 1억 → 현재 1억 1천만 (10% ↑)
      cacheRepo.find.mockResolvedValue([
        makeCache({ avg: 110_000_000, yearMonth: "202605" }),
        makeCache({ avg: 100_000_000, yearMonth: "202604" }),
      ]);
      notificationRepo.count.mockResolvedValue(0);

      await service.detectPriceChange();

      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
      const saved = notificationRepo.save.mock.calls[0][0] as Notification;
      expect(saved.type).toBe("price_change");
      expect(saved.userId).toBe(10);
      expect(saved.referenceId).toBe("서울 강남구:202605");
    });

    it("가격 변동 < 5% 시 알림 미생성", async () => {
      prefRepo.find.mockResolvedValue([makePref()]);
      // 1억 → 1억 200만 (2% ↑)
      cacheRepo.find.mockResolvedValue([
        makeCache({ avg: 102_000_000, yearMonth: "202605" }),
        makeCache({ avg: 100_000_000, yearMonth: "202604" }),
      ]);

      await service.detectPriceChange();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("동일 referenceId 알림이 이미 존재하면 skip", async () => {
      prefRepo.find.mockResolvedValue([makePref()]);
      cacheRepo.find.mockResolvedValue([
        makeCache({ avg: 110_000_000, yearMonth: "202605" }),
        makeCache({ avg: 100_000_000, yearMonth: "202604" }),
      ]);
      // 중복 알림 있음
      notificationRepo.count.mockResolvedValue(1);

      await service.detectPriceChange();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("활성 preference 가 없으면 알림 미생성 + 에러 없음", async () => {
      prefRepo.find.mockResolvedValue([]);

      await expect(service.detectPriceChange()).resolves.not.toThrow();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("이전값이 없으면(=캐시 1개 이하) 알림 스킵 (baseline)", async () => {
      prefRepo.find.mockResolvedValue([makePref()]);
      cacheRepo.find.mockResolvedValue([
        makeCache({ avg: 100_000_000, yearMonth: "202605" }),
      ]);

      await service.detectPriceChange();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });
  });

  // ----- detectNewAnnouncement -----
  describe("detectNewAnnouncement", () => {
    it("신규 공고 + 관심 지역 매칭 시 알림 생성 (type=announcement, referenceId=announcement:<id>)", async () => {
      prefRepo.find.mockResolvedValue([makePref({ regions: ["서울 강남구"] })]);
      announcementRepo.find.mockResolvedValue([
        makeAnnouncement({ id: 42, region: "서울 강남구" }),
      ]);
      notificationRepo.count.mockResolvedValue(0);

      await service.detectNewAnnouncement();

      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
      const saved = notificationRepo.save.mock.calls[0][0] as Notification;
      expect(saved.type).toBe("announcement");
      expect(saved.userId).toBe(10);
      expect(saved.referenceId).toBe("announcement:42");
    });

    it("키워드가 있고 매칭 안되면 skip", async () => {
      prefRepo.find.mockResolvedValue([
        makePref({
          regions: ["서울 강남구"],
          announcementKeywords: ["다자녀"],
        }),
      ]);
      // 제목에 "다자녀" 없음
      announcementRepo.find.mockResolvedValue([
        makeAnnouncement({
          id: 42,
          title: "청년 특별공급 공고",
          region: "서울 강남구",
        }),
      ]);

      await service.detectNewAnnouncement();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("지역 미매칭 시 skip", async () => {
      prefRepo.find.mockResolvedValue([makePref({ regions: ["서울 강남구"] })]);
      announcementRepo.find.mockResolvedValue([
        makeAnnouncement({ id: 42, region: "부산 해운대구" }),
      ]);

      await service.detectNewAnnouncement();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("중복 referenceId 존재 시 skip", async () => {
      prefRepo.find.mockResolvedValue([makePref({ regions: ["서울 강남구"] })]);
      announcementRepo.find.mockResolvedValue([
        makeAnnouncement({ id: 42, region: "서울 강남구" }),
      ]);
      notificationRepo.count.mockResolvedValue(1);

      await service.detectNewAnnouncement();

      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("키워드가 비어있으면 지역 매칭만으로 알림 생성", async () => {
      prefRepo.find.mockResolvedValue([
        makePref({ regions: ["서울 강남구"], announcementKeywords: [] }),
      ]);
      announcementRepo.find.mockResolvedValue([
        makeAnnouncement({
          id: 50,
          title: "임의 공고",
          region: "서울 강남구",
        }),
      ]);
      notificationRepo.count.mockResolvedValue(0);

      await service.detectNewAnnouncement();

      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
