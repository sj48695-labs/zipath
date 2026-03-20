import { SubscriptionService } from "../src/subscription/subscription.service";

describe("SubscriptionService", () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  it("should return eligible for 1순위 when conditions met", () => {
    const result = service.simulate({
      age: 30,
      income: 5000,
      homelessMonths: 36,
    });

    const first = result.results.find((r) => r.type === "1순위 일반공급");
    expect(first).toBeDefined();
    expect(first!.eligible).toBe(true);
  });

  it("should return ineligible for 1순위 when income exceeds limit", () => {
    const result = service.simulate({
      age: 30,
      income: 7000,
      homelessMonths: 36,
    });

    const first = result.results.find((r) => r.type === "1순위 일반공급");
    expect(first).toBeDefined();
    expect(first!.eligible).toBe(false);
    expect(first!.reason).toContain("소득");
  });

  it("should return ineligible for 1순위 when under age or insufficient homeless months", () => {
    const result = service.simulate({
      age: 18,
      income: 3000,
      homelessMonths: 12,
    });

    const first = result.results.find((r) => r.type === "1순위 일반공급");
    expect(first!.eligible).toBe(false);
  });

  it("should return eligible for 신혼부부 when married and income is low", () => {
    const result = service.simulate({
      age: 28,
      income: 6000,
      homelessMonths: 0,
      isMarried: true,
    });

    const newlywed = result.results.find((r) => r.type.includes("신혼부부"));
    expect(newlywed).toBeDefined();
    expect(newlywed!.eligible).toBe(true);
  });

  it("should return eligible for 생애최초 when conditions met", () => {
    const result = service.simulate({
      age: 25,
      income: 5000,
      homelessMonths: 0,
      isFirstHome: true,
    });

    const firstLife = result.results.find((r) => r.type.includes("생애최초"));
    expect(firstLife).toBeDefined();
    expect(firstLife!.eligible).toBe(true);
  });

  it("should return positive message when eligible types exist", () => {
    const result = service.simulate({
      age: 30,
      income: 5000,
      homelessMonths: 36,
    });

    expect(result.message).toContain("가능한");
  });

  it("should include input in response", () => {
    const input = { age: 30, income: 5000, homelessMonths: 36 };
    const result = service.simulate(input);
    expect(result.input).toEqual(input);
  });

  it("should calculate points", () => {
    const result = service.simulate({
      age: 35,
      income: 5000,
      homelessMonths: 120,
      dependents: 3,
    });

    expect(result.points).toBeDefined();
    expect(result.totalPoints).toBeGreaterThan(0);
    expect(result.maxPoints).toBe(84);
  });
});
