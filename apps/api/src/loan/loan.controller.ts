import { Controller, Post, Body } from "@nestjs/common";
import { LoanService } from "./loan.service";

@Controller("loan")
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post("calculate")
  calculate(
    @Body()
    body: {
      annualIncome: number;
      existingDebt: number;
      housePrice: number;
      loanTermYears?: number;
    },
  ) {
    return this.loanService.calculate(body);
  }
}
