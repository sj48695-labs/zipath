import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { LoanService } from "./loan.service";

const calculateSchema = z.object({
  annualIncome: z.number().min(0),
  existingDebt: z.number().min(0),
  housePrice: z.number().positive(),
  loanTermYears: z.number().int().min(1).max(50).optional(),
});

@Controller("loan")
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post("calculate")
  calculate(@Body() body: unknown) {
    const parsed = calculateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    return this.loanService.calculate(parsed.data);
  }
}
