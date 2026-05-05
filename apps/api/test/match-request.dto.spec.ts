import { matchRequestSchema } from "../src/announcement/dto/match-request.dto";

describe("matchRequestSchema", () => {
  it("should accept the minimum required payload", () => {
    const result = matchRequestSchema.safeParse({
      age: 30,
      income: 5000,
      homelessMonths: 36,
    });
    expect(result.success).toBe(true);
  });

  it("should accept all optional fields together (frontend full payload)", () => {
    const result = matchRequestSchema.safeParse({
      age: 30,
      income: 5000,
      homelessMonths: 36,
      dependents: 2,
      region: "서울",
      isMarried: true,
      isFirstHome: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependents).toBe(2);
      expect(result.data.region).toBe("서울");
      expect(result.data.isMarried).toBe(true);
      expect(result.data.isFirstHome).toBe(true);
    }
  });

  it("should accept omitted optional fields (region/isMarried/isFirstHome)", () => {
    const result = matchRequestSchema.safeParse({
      age: 30,
      income: 5000,
      homelessMonths: 36,
      dependents: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.region).toBeUndefined();
      expect(result.data.isMarried).toBeUndefined();
      expect(result.data.isFirstHome).toBeUndefined();
    }
  });

  it("should reject negative age", () => {
    const result = matchRequestSchema.safeParse({
      age: -1,
      income: 5000,
      homelessMonths: 36,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer age", () => {
    const result = matchRequestSchema.safeParse({
      age: 30.5,
      income: 5000,
      homelessMonths: 36,
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const result = matchRequestSchema.safeParse({
      age: 30,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative income", () => {
    const result = matchRequestSchema.safeParse({
      age: 30,
      income: -100,
      homelessMonths: 36,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer dependents", () => {
    const result = matchRequestSchema.safeParse({
      age: 30,
      income: 5000,
      homelessMonths: 36,
      dependents: 1.5,
    });
    expect(result.success).toBe(false);
  });
});
