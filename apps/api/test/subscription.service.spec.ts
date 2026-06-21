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

  const homelessScore = (months: number) =>
    service.simulate({ age: 20, income: 5000, homelessMonths: months }).points.find(
      (p) => p.category === "무주택 기간",
    )!.score;

  const dependentScore = (count: number) =>
    service.simulate({ age: 20, income: 5000, homelessMonths: 0, dependents: count }).points.find(
      (p) => p.category === "부양가족 수",
    )!.score;

  const savingsScore = (age: number) =>
    service.simulate({ age, income: 5000, homelessMonths: 0 }).points.find(
      (p) => p.category === "청약통장 가입기간",
    )!.score;

  it("should map 무주택 기간 boundaries to expected scores", () => {
    expect(homelessScore(0)).toBe(0);
    expect(homelessScore(12)).toBe(2); // 1년
    expect(homelessScore(14 * 12)).toBe(28); // 14년
    expect(homelessScore(15 * 12)).toBe(32); // 15년 점프
    expect(homelessScore(20 * 12)).toBe(32); // 상한 유지
  });

  it("should map 부양가족 수 boundaries to expected scores", () => {
    expect(dependentScore(0)).toBe(0);
    expect(dependentScore(1)).toBe(5);
    expect(dependentScore(5)).toBe(25);
    expect(dependentScore(6)).toBe(35); // 6명 점프
    expect(dependentScore(10)).toBe(35); // 상한 유지
  });

  it("should map 청약통장 가입기간 boundaries to expected scores", () => {
    expect(savingsScore(19)).toBe(0); // 추정 0년
    expect(savingsScore(20)).toBe(1); // 1년
    expect(savingsScore(33)).toBe(14); // 14년
    expect(savingsScore(34)).toBe(17); // 15년 점프
  });

  it("should use savingsMonths input for 청약통장 점수 when provided", () => {
    // age 20 → 폴백 추정 1년(1점)이지만, 실제 가입 15년(180개월) → 17점
    const savings = service
      .simulate({ age: 20, income: 5000, homelessMonths: 0, savingsMonths: 180 })
      .points.find((p) => p.category === "청약통장 가입기간")!;
    expect(savings.score).toBe(17);
    expect(savings.description).toContain("180개월");
  });

  it("should fall back to age estimate when savingsMonths is omitted", () => {
    const savings = service
      .simulate({ age: 20, income: 5000, homelessMonths: 0 })
      .points.find((p) => p.category === "청약통장 가입기간")!;
    expect(savings.score).toBe(1);
    expect(savings.description).toContain("추정");
  });
});
