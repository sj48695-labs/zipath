import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, ObjectLiteral } from "typeorm";
import {
  Notification,
  NotificationPreference,
} from "@zipath/db";
import { NotificationService } from "../src/notification/notification.service";

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makePreference = (
  overrides: Partial<NotificationPreference> = {},
): NotificationPreference =>
  ({
    id: 1,
    userId: 7,
    regions: ["서울 강남구"],
    priceThresholdMin: 10_000,
    priceThresholdMax: 50_000,
    announcementKeywords: ["신혼"],
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as NotificationPreference;

const makeNotification = (
  overrides: Partial<Notification> = {},
): Notification =>
  ({
    id: 11,
    userId: 7,
    type: "announcement",
    title: "새 공고",
    message: "관심 지역에 새 공고가 등록되었습니다.",
    referenceId: "announcement:99",
    readAt: null,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  }) as Notification;

describe("NotificationService", () => {
  let service: NotificationService;
  let preferenceRepo: MockRepository<NotificationPreference>;
  let notificationRepo: MockRepository<Notification>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    preferenceRepo = module.get(getRepositoryToken(NotificationPreference));
    notificationRepo = module.get(getRepositoryToken(Notification));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("preference CRUD", () => {
    it("creates a preference for a user when none exists", async () => {
      preferenceRepo.findOne!.mockResolvedValue(null);
      preferenceRepo.create!.mockImplementation((value: unknown) => value);
      preferenceRepo.save!.mockImplementation(async (value: unknown) => value);

      const result = await service.createPreference(7, {
        regions: ["서울 강남구"],
        priceThresholdMin: 10_000,
        priceThresholdMax: 50_000,
        announcementKeywords: ["신혼"],
      });

      expect(preferenceRepo.create).toHaveBeenCalledWith({
        userId: 7,
        regions: ["서울 강남구"],
        priceThresholdMin: 10_000,
        priceThresholdMax: 50_000,
        announcementKeywords: ["신혼"],
      });
      expect(result.userId).toBe(7);
    });

    it("updates the existing preference instead of creating a duplicate", async () => {
      const preference = makePreference();
      preferenceRepo.findOne!.mockResolvedValue(preference);
      preferenceRepo.save!.mockImplementation(async (value: unknown) => value);

      await service.createPreference(7, {
        regions: ["서울 서초구"],
        priceThresholdMin: null,
        priceThresholdMax: 60_000,
        announcementKeywords: ["청년"],
      });

      expect(preferenceRepo.create).not.toHaveBeenCalled();
      expect(preference.regions).toEqual(["서울 서초구"]);
      expect(preference.priceThresholdMin).toBeNull();
      expect(preference.priceThresholdMax).toBe(60_000);
      expect(preference.announcementKeywords).toEqual(["청년"]);
    });

    it("returns the preference for the authenticated user only", async () => {
      preferenceRepo.findOne!.mockResolvedValue(makePreference());

      await service.getPreference(7);

      expect(preferenceRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 7 },
      });
    });

    it("throws when updating a missing preference", async () => {
      preferenceRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.updatePreference(99, 7, { isActive: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates only provided preference fields", async () => {
      const preference = makePreference();
      preferenceRepo.findOne!.mockResolvedValue(preference);
      preferenceRepo.save!.mockImplementation(async (value: unknown) => value);

      await service.updatePreference(1, 7, {
        announcementKeywords: ["다자녀"],
        isActive: false,
      });

      expect(preference.regions).toEqual(["서울 강남구"]);
      expect(preference.announcementKeywords).toEqual(["다자녀"]);
      expect(preference.isActive).toBe(false);
    });

    it("throws when deleting a missing preference", async () => {
      preferenceRepo.delete!.mockResolvedValue({ affected: 0 });

      await expect(service.deletePreference(1, 7)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("notifications", () => {
    it("returns notifications with pagination and total count", async () => {
      const notifications = [
        makeNotification({ id: 21, readAt: null }),
        makeNotification({ id: 20, referenceId: null }),
      ];
      notificationRepo.findAndCount!.mockResolvedValue([notifications, 2]);

      const result = await service.getNotifications(7, 2, 10);

      expect(notificationRepo.findAndCount).toHaveBeenCalledWith({
        where: { userId: 7 },
        order: { createdAt: "DESC" },
        skip: 10,
        take: 10,
      });
      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notifications[0].referenceId).toBe("announcement:99");
      expect(result.notifications[0].readAt).toBeNull();
    });

    it("marks a notification as read for the authenticated user", async () => {
      const notification = makeNotification();
      notificationRepo.findOne!.mockResolvedValue(notification);
      notificationRepo.save!.mockImplementation(async (value: unknown) => value);

      const result = await service.markAsRead(11, 7);

      expect(notificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 11, userId: 7 },
      });
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it("throws when marking a missing notification as read", async () => {
      notificationRepo.findOne!.mockResolvedValue(null);

      await expect(service.markAsRead(11, 7)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("marks unread notifications as read in bulk", async () => {
      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };
      notificationRepo.createQueryBuilder!.mockReturnValue(queryBuilder);

      await service.markAllAsRead(7);

      expect(notificationRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(queryBuilder.update).toHaveBeenCalledTimes(1);
      expect(queryBuilder.set).toHaveBeenCalledTimes(1);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        "userId = :userId AND readAt IS NULL",
        { userId: 7 },
      );
      expect(queryBuilder.execute).toHaveBeenCalledTimes(1);
    });

    it("counts unread notifications only for the authenticated user", async () => {
      notificationRepo.count!.mockResolvedValue(4);

      const result = await service.getUnreadCount(7);

      expect(notificationRepo.count).toHaveBeenCalledWith({
        where: {
          userId: 7,
          readAt: expect.anything(),
        },
      });
      expect(result).toBe(4);
    });
  });
});
