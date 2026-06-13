import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, ObjectLiteral } from "typeorm";
import { ChecklistTemplate, ChecklistItem } from "@zipath/db";
import { ChecklistService } from "./checklist.service";

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createTemplateRepo = (): MockRepository<ChecklistTemplate> => ({
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const createItemRepo = (): MockRepository<ChecklistItem> => ({
  create: jest.fn(),
  save: jest.fn(),
});

describe("ChecklistService", () => {
  let service: ChecklistService;
  let templateRepo: MockRepository<ChecklistTemplate>;
  let itemRepo: MockRepository<ChecklistItem>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        {
          provide: getRepositoryToken(ChecklistTemplate),
          useValue: createTemplateRepo(),
        },
        {
          provide: getRepositoryToken(ChecklistItem),
          useValue: createItemRepo(),
        },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
    templateRepo = module.get(getRepositoryToken(ChecklistTemplate));
    itemRepo = module.get(getRepositoryToken(ChecklistItem));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleInit", () => {
    it("should seed 3 templates with items when DB is empty", async () => {
      templateRepo.count!.mockResolvedValue(0);
      templateRepo.create!.mockImplementation((v: unknown) => v);
      templateRepo.save!.mockResolvedValue({ id: 1 });
      itemRepo.create!.mockImplementation((v: unknown) => v);
      itemRepo.save!.mockResolvedValue([]);

      await service.onModuleInit();

      // rent, jeonse, buy 3개 타입
      expect(templateRepo.save).toHaveBeenCalledTimes(3);
      expect(itemRepo.save).toHaveBeenCalledTimes(3);
    });

    it("should skip seeding when templates already exist", async () => {
      templateRepo.count!.mockResolvedValue(5);

      await service.onModuleInit();

      expect(templateRepo.save).not.toHaveBeenCalled();
      expect(itemRepo.save).not.toHaveBeenCalled();
    });

    it("should not throw when seeding fails", async () => {
      templateRepo.count!.mockRejectedValue(new Error("DB down"));

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe("getByType", () => {
    it("should return DB template items sorted by order", async () => {
      templateRepo.findOne!.mockResolvedValue({
        title: "월세 계약 체크리스트",
        items: [
          { order: 2, category: "B", content: "둘째", isRequired: false },
          { order: 1, category: "A", content: "첫째", isRequired: true },
        ],
      });

      const result = await service.getByType("rent");

      expect(result.title).toBe("월세 계약 체크리스트");
      expect(result.items.map((i) => i.content)).toEqual(["첫째", "둘째"]);
    });

    it("should fall back to seed data when DB query fails", async () => {
      templateRepo.findOne!.mockRejectedValue(new Error("DB error"));

      const result = await service.getByType("jeonse");

      expect(result.title).toBe("전세 계약 체크리스트");
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should fall back to seed data when template is not in DB", async () => {
      templateRepo.findOne!.mockResolvedValue(null);

      const result = await service.getByType("buy");

      expect(result.title).toBe("매매 계약 체크리스트");
    });

    it("should throw NotFoundException for an unknown type", async () => {
      templateRepo.findOne!.mockResolvedValue(null);

      await expect(service.getByType("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
