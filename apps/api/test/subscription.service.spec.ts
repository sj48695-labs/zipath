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
      savingsYears: 10,
      savingsMonths: 0,
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
      savingsYears: 10,
      savingsMonths: 0,
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
      savingsYears: 1,
      savingsMonths: 0,
    });

    const first = result.results.find((r) => r.type === "1순위 일반공급");
    expect(first).toBeDefined();
    expect(first!.eligible).toBe(false);
  });

  it("should return eligible for 신혼부부 when married and income is low", () => {
    const result = service.simulate({
      age: 28,
      income: 6000,
      homelessMonths: 0,
      savingsYears: 3,
      savingsMonths: 0,
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
      savingsYears: 2,
      savingsMonths: 0,
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
      savingsYears: 10,
      savingsMonths: 0,
    });

    expect(result.message).toContain("가능한");
    expect(result.message).toContain("입력 기준");
  });

  it("should include input in response", () => {
    const input = {
      age: 30,
      income: 5000,
      homelessMonths: 36,
      savingsYears: 10,
      savingsMonths: 0,
    };
    const result = service.simulate(input);
    expect(result.input).toEqual(input);
  });

  it("should calculate points", () => {
    const result = service.simulate({
      age: 35,
      income: 5000,
      homelessMonths: 120,
      dependents: 3,
      savingsYears: 15,
      savingsMonths: 0,
    });

    expect(result.points).toBeDefined();
    expect(result.totalPoints).toBeGreaterThan(0);
    expect(result.maxPoints).toBe(84);
  });

  const homelessScore = (months: number) =>
    service
      .simulate({
        age: 20,
        income: 5000,
        homelessMonths: months,
        savingsYears: 0,
        savingsMonths: 0,
      })
      .points.find((p) => p.category === "무주택 기간")!.score;

  const dependentScore = (count: number) =>
    service
      .simulate({
        age: 20,
        income: 5000,
        homelessMonths: 0,
        dependents: count,
        savingsYears: 0,
        savingsMonths: 0,
      })
      .points.find((p) => p.category === "부양가족 수")!.score;

  const savingsScore = (
    savingsYears: number,
    savingsMonths: number = 0,
    age = 20,
  ) =>
    service
      .simulate({
        age,
        income: 5000,
        homelessMonths: 0,
        savingsYears,
        savingsMonths,
      })
      .points.find((p) => p.category === "청약통장 가입기간")!.score;

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
    expect(savingsScore(0, 0)).toBe(0);
    expect(savingsScore(1, 0)).toBe(1);
    expect(savingsScore(14, 11)).toBe(14);
    expect(savingsScore(15, 0)).toBe(17);
  });

  it("should use entered savings duration instead of age-based estimate", () => {
    const savings = service
      .simulate({
        age: 40,
        income: 5000,
        homelessMonths: 0,
        savingsYears: 3,
        savingsMonths: 6,
      })
      .points.find((p) => p.category === "청약통장 가입기간")!;

    expect(savings.score).toBe(3);
    expect(savings.description).toBe("가입 3년 6개월");
    expect(savings.description).not.toContain("추정");
  });

  it("should ignore age when savings duration is the same", () => {
    const younger = service
      .simulate({
        age: 20,
        income: 5000,
        homelessMonths: 0,
        savingsYears: 1,
        savingsMonths: 0,
      })
      .points.find((p) => p.category === "청약통장 가입기간")!;
    const older = service
      .simulate({
        age: 50,
        income: 5000,
        homelessMonths: 0,
        savingsYears: 1,
        savingsMonths: 0,
      })
      .points.find((p) => p.category === "청약통장 가입기간")!;

    expect(younger.score).toBe(1);
    expect(older.score).toBe(1);
    expect(younger.description).toBe("가입 1년 0개월");
  });
});
