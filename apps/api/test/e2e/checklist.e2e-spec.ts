import { NotFoundException } from "@nestjs/common";
import { ChecklistController } from "@/checklist/checklist.controller";
import { ChecklistService } from "@/checklist/checklist.service";

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
  const service = new ChecklistService(
    mockTemplateRepo as never,
    mockItemRepo as never,
  );
  const controller = new ChecklistController(service);

  it("월세 체크리스트를 반환한다", async () => {
    const res = await controller.getChecklist("rent");

    expect(res.title).toBe("월세 계약 체크리스트");
    expect(res.items).toBeDefined();
    expect(res.items.length).toBeGreaterThan(0);

    const item = res.items[0];
    expect(item).toHaveProperty("category");
    expect(item).toHaveProperty("content");
    expect(item).toHaveProperty("isRequired");
  });

  it("전세 체크리스트를 반환한다", async () => {
    const res = await controller.getChecklist("jeonse");

    expect(res.title).toBe("전세 계약 체크리스트");
    expect(res.items.length).toBeGreaterThan(0);
  });

  it("매매 체크리스트를 반환한다", async () => {
    const res = await controller.getChecklist("buy");

    expect(res.title).toBe("매매 계약 체크리스트");
    expect(res.items.length).toBeGreaterThan(0);
  });

  it("존재하지 않는 타입이면 404를 반환한다", async () => {
    await expect(controller.getChecklist("invalid")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
