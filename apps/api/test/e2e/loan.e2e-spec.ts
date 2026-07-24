import { BadRequestException } from "@nestjs/common";
import { LoanController } from "@/loan/loan.controller";
import { LoanService } from "@/loan/loan.service";

describe("LoanController (e2e)", () => {
  const service = new LoanService();
  const controller = new LoanController(service);

  describe("POST /api/loan/calculate", () => {
    it("대출 한도를 계산한다", () => {
      const res = controller.calculate({
        annualIncome: 50000000,
        existingDebt: 0,
        housePrice: 500000000,
      });

      expect(res.input).toBeDefined();
      expect(res.result).toBeDefined();
      expect(res.result.maxLoanAmount).toBeGreaterThan(0);
      expect(res.result.monthlyPayment).toBeGreaterThan(0);
      expect(res.result.maxByLtv).toBe(350000000);
    });

    it("기존 대출이 있으면 한도가 줄어든다", () => {
      const res = controller.calculate({
        annualIncome: 50000000,
        existingDebt: 100000000,
        housePrice: 500000000,
      });

      expect(res.result.maxByDsr).toBeLessThan(350000000);
    });

    it("필수 필드가 없으면 400을 반환한다", () => {
      expect(() =>
        controller.calculate({ annualIncome: 50000000 } as never),
      ).toThrow(BadRequestException);
    });

    it("housePrice가 0이면 400을 반환한다", () => {
      expect(() =>
        controller.calculate({
          annualIncome: 50000000,
          existingDebt: 0,
          housePrice: 0,
        }),
      ).toThrow(BadRequestException);
    });

    it("음수 값이면 400을 반환한다", () => {
      expect(() =>
        controller.calculate({
          annualIncome: -1,
          existingDebt: 0,
          housePrice: 500000000,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
