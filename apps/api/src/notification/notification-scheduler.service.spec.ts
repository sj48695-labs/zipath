import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";
import {
  Announcement,
  Notification,
  NotificationPreference,
  PriceBaseline,
} from "@zipath/db";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { RealPriceService } from "../real-price/real-price.service";

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  find: jest.fn(),
  findBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => Promise.resolve(entity)),
});

describe("NotificationSchedulerService", () => {
  let service: NotificationSchedulerService;
  let preferenceRepo: MockRepository<NotificationPreference>;
  let notificationRepo: MockRepository<Notification>;
  let baselineRepo: MockRepository<PriceBaseline>;
  let announcementRepo: MockRepository<Announcement>;
  let realPriceService: { search: jest.Mock };

  beforeEach(async () => {
    realPriceService = { search: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSchedulerService,
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PriceBaseline),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Announcement),
          useValue: createMockRepository(),
        },
        { provide: RealPriceService, useValue: realPriceService },
      ],
    }).compile();

    service = module.get<NotificationSchedulerService>(
      NotificationSchedulerService,
    );
    preferenceRepo = module.get(getRepositoryToken(NotificationPreference));
    notificationRepo = module.get(getRepositoryToken(Notification));
    baselineRepo = module.get(getRepositoryToken(PriceBaseline));
    announcementRepo = module.get(getRepositoryToken(Announcement));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("detectPriceChanges", () => {
    it("baseline 미존재 시 알림 없이 baseline 만 저장한다", async () => {
      preferenceRepo.findBy!.mockResolvedValue([
        { id: 1, userId: 10, regions: ["11680"], isActive: true },
      ]);
      realPriceService.search.mockResolvedValue({
        trades: [
          { dealAmount: "100,000" },
          { dealAmount: "120,000" },
        ],
      });
      baselineRepo.findOne!.mockResolvedValue(null);

      await service.detectPriceChanges();

      expect(baselineRepo.save).toHaveBeenCalledTimes(1);
      const savedBaseline = baselineRepo.save!.mock.calls[0][0] as {
        regionCode: string;
        avgPrice: number;
      };
      expect(savedBaseline.regionCode).toBe("11680");
      expect(savedBaseline.avgPrice).toBe(110000);
      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("baseline 대비 +5% 변동 시 알림을 생성하고 baseline 을 갱신한다", async () => {
      preferenceRepo.findBy!.mockResolvedValue([
        { id: 1, userId: 10, regions: ["11680"], isActive: true },
      ]);
      realPriceService.search.mockResolvedValue({
        trades: [{ dealAmount: "105,000" }], // 100000 -> 105000 (+5%)
      });
      baselineRepo.findOne!.mockResolvedValue({
        id: 1,
        regionCode: "11680",
        dealType: "매매",
        yearMonth: "202505",
        avgPrice: 100000,
        tradeCount: 1,
      });
      notificationRepo.findBy!.mockResolvedValue([]);

      await service.detectPriceChanges();

      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
      const saved = notificationRepo.save!.mock.calls[0][0] as {
        userId: number;
        type: string;
        referenceId: string;
        message: string;
      };
      expect(saved.userId).toBe(10);
      expect(saved.type).toBe("PRICE_CHANGE");
      expect(saved.referenceId).toMatch(/^11680:\d{6}$/);
      expect(saved.message).toContain("참고용이며 법적 효력이 없습니다");

      expect(baselineRepo.save).toHaveBeenCalledTimes(1);
      const updatedBaseline = baselineRepo.save!.mock.calls[0][0] as {
        avgPrice: number;
      };
      expect(updatedBaseline.avgPrice).toBe(105000);
    });

    it("동일 referenceId 알림이 이미 있으면 스킵한다", async () => {
      preferenceRepo.findBy!.mockResolvedValue([
        { id: 1, userId: 10, regions: ["11680"], isActive: true },
      ]);
      realPriceService.search.mockResolvedValue({
        trades: [{ dealAmount: "110,000" }], // +10% 변동
      });
      baselineRepo.findOne!.mockResolvedValue({
        id: 1,
        regionCode: "11680",
        dealType: "매매",
        yearMonth: "202505",
        avgPrice: 100000,
        tradeCount: 1,
      });
      notificationRepo.findBy!.mockResolvedValue([
        { id: 99, userId: 10, type: "PRICE_CHANGE", referenceId: "11680:202505" },
      ]);

      await service.detectPriceChanges();

      expect(notificationRepo.save).not.toHaveBeenCalled();
      expect(baselineRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("detectNewAnnouncements", () => {
    it("lastAnnouncementCheckAt 이 null 인 첫 실행은 시각만 기록한다", async () => {
      await service.detectNewAnnouncements();

      expect(announcementRepo.findBy).not.toHaveBeenCalled();
      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it("관심 지역 매칭 공고가 있으면 사용자에게 알림을 생성한다", async () => {
      await service.detectNewAnnouncements();

      announcementRepo.findBy!.mockResolvedValue([
        {
          id: 42,
          title: "강남 신혼희망타운",
          region: "서울특별시 강남구",
          createdAt: new Date(),
        },
      ]);
      preferenceRepo.findBy!.mockResolvedValue([
        {
          id: 1,
          userId: 10,
          // 토큰 매칭: "서울","강남구" 가 "서울특별시 강남구" 에 모두 포함 → match
          regions: ["서울 강남구"],
          isActive: true,
        },
      ]);
      notificationRepo.findBy!.mockResolvedValue([]);

      await service.detectNewAnnouncements();

      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
      const saved = notificationRepo.save!.mock.calls[0][0] as {
        userId: number;
        type: string;
        referenceId: string;
        message: string;
      };
      expect(saved.userId).toBe(10);
      expect(saved.type).toBe("NEW_ANNOUNCEMENT");
      expect(saved.referenceId).toBe("announcement:42");
      expect(saved.message).toContain("참고용이며 법적 효력이 없습니다");
    });
  });

  describe("handleChangeDetection", () => {
    it("detectPriceChanges 와 detectNewAnnouncements 를 순차 호출한다", async () => {
      const priceSpy = jest
        .spyOn(service, "detectPriceChanges")
        .mockResolvedValue();
      const announcementSpy = jest
        .spyOn(service, "detectNewAnnouncements")
        .mockResolvedValue();

      await service.handleChangeDetection();

      expect(priceSpy).toHaveBeenCalledTimes(1);
      expect(announcementSpy).toHaveBeenCalledTimes(1);
      // 호출 순서 검증
      expect(priceSpy.mock.invocationCallOrder[0]).toBeLessThan(
        announcementSpy.mock.invocationCallOrder[0],
      );
    });
  });
});
