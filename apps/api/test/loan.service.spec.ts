import { LoanService } from "../src/loan/loan.service";

describe("LoanService", () => {
  let service: LoanService;

  beforeEach(() => {
    service = new LoanService();
  });

  it("should calculate LTV correctly (70% of house price)", () => {
    const result = service.calculate({
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 50000,
    });

    expect(result.result.maxByLtv).toBe(35000);
  });

  it("should respect DSR 40% limit", () => {
    const result = service.calculate({
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 100000,
    });

    // maxLoanAmount should be limited by DSR, not LTV
    expect(result.result.maxLoanAmount).toBeLessThanOrEqual(result.result.maxByLtv);
    expect(result.result.maxLoanAmount).toBe(result.result.maxByDsr);
  });

  it("should reduce loan when existing debt exists", () => {
    const noDebt = service.calculate({
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 50000,
    });

    const withDebt = service.calculate({
      annualIncome: 5000,
      existingDebt: 10000,
      housePrice: 50000,
    });

    expect(withDebt.result.maxLoanAmount).toBeLessThan(
      noDebt.result.maxLoanAmount,
    );
  });

  it("should return 0 loan when income is too low", () => {
    const result = service.calculate({
      annualIncome: 100,
      existingDebt: 50000,
      housePrice: 50000,
    });

    expect(result.result.maxLoanAmount).toBe(0);
    expect(result.result.monthlyPayment).toBe(0);
  });

  it("should include rate and ratio info", () => {
    const result = service.calculate({
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 50000,
    });

    expect(result.result.annualRate).toBe("4.0%");
    expect(result.result.dsrRatio).toBe("40%");
    expect(result.result.ltvRatio).toBe("70%");
  });

  it("should use custom loan term", () => {
    const result = service.calculate({
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 50000,
      loanTermYears: 20,
    });

    expect(result.result.loanTermYears).toBe(20);
    // Shorter term = higher monthly payment for same loan
    const result30 = service.calculate({
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 50000,
      loanTermYears: 30,
    });
    expect(result.result.monthlyPayment).toBeGreaterThanOrEqual(
      result30.result.monthlyPayment,
    );
  });

  it("should include input in response", () => {
    const input = {
      annualIncome: 5000,
      existingDebt: 0,
      housePrice: 50000,
    };
    const result = service.calculate(input);
    expect(result.input).toEqual(input);
  });
});
