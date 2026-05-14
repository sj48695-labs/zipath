import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, ObjectLiteral } from "typeorm";
import { RealPriceCache, Announcement, User } from "@zipath/db";
import { CleanupService } from "./cleanup.service";

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const makeQb = (affected = 0) => {
  const qb = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  };
  return qb;
};

const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  delete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
});

describe("CleanupService", () => {
  let service: CleanupService;
  let cacheRepo: MockRepository<RealPriceCache>;
  let announcementRepo: MockRepository<Announcement>;
  let userRepo: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        {
          provide: getRepositoryToken(RealPriceCache),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Announcement),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
    cacheRepo = module.get(getRepositoryToken(RealPriceCache));
    announcementRepo = module.get(getRepositoryToken(Announcement));
    userRepo = module.get(getRepositoryToken(User));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("cleanExpiredCache", () => {
    it("should delete cache records older than 3 months", async () => {
      cacheRepo.delete!.mockResolvedValue({ affected: 5 });

      await service.cleanExpiredCache();

      expect(cacheRepo.delete).toHaveBeenCalledTimes(1);
      const callArg = cacheRepo.delete!.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(callArg).toHaveProperty("fetchedAt");
    });

    it("should handle zero affected rows", async () => {
      cacheRepo.delete!.mockResolvedValue({ affected: 0 });

      await service.cleanExpiredCache();

      expect(cacheRepo.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanAnnouncements", () => {
    it("should issue a single OR delete covering endDate and fetchedAt", async () => {
      const qb = makeQb(7);
      announcementRepo.createQueryBuilder!.mockReturnValue(qb);

      await service.cleanAnnouncements();

      expect(announcementRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(qb.delete).toHaveBeenCalledTimes(1);
      expect(qb.where).toHaveBeenCalledTimes(1);
      const [whereClause] = qb.where.mock.calls[0] as [string];
      expect(whereClause).toMatch(/endDate/);
      expect(whereClause).toMatch(/fetchedAt/);
      expect(qb.execute).toHaveBeenCalledTimes(1);
    });

    it("should handle zero affected rows", async () => {
      const qb = makeQb(0);
      announcementRepo.createQueryBuilder!.mockReturnValue(qb);

      await service.cleanAnnouncements();

      expect(qb.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanInactiveUsers", () => {
    it("should delete users inactive for over 1 year", async () => {
      userRepo.delete!.mockResolvedValue({ affected: 2 });

      await service.cleanInactiveUsers();

      expect(userRepo.delete).toHaveBeenCalledTimes(1);
      const callArg = userRepo.delete!.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(callArg).toHaveProperty("lastActiveAt");
    });
  });

  describe("handleCleanup", () => {
    it("should run all cleanup methods", async () => {
      const qb = makeQb(3);
      cacheRepo.delete!.mockResolvedValue({ affected: 5 });
      announcementRepo.createQueryBuilder!.mockReturnValue(qb);
      userRepo.delete!.mockResolvedValue({ affected: 2 });

      await service.handleCleanup();

      expect(cacheRepo.delete).toHaveBeenCalledTimes(1);
      expect(announcementRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(userRepo.delete).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors if a cleanup step fails", async () => {
      cacheRepo.delete!.mockRejectedValue(new Error("DB error"));

      await expect(service.handleCleanup()).rejects.toThrow("DB error");
    });
  });
});
