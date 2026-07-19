import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import type { SubscriptionSimulationInput } from "@zipath/types";
import { z } from "zod";
import { SubscriptionService } from "./subscription.service";

const simulateSchema = z.object({
  age: z.number().int().min(0).max(150),
  income: z.number().min(0),
  homelessMonths: z.number().int().min(0),
  dependents: z.number().int().min(0).optional(),
  savingsYears: z.number().int().min(0),
  savingsMonths: z.number().int().min(0).max(11),
  region: z.string().optional(),
  isMarried: z.boolean().optional(),
  isFirstHome: z.boolean().optional(),
});

@Controller("subscription")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post("simulate")
  simulate(@Body() body: unknown): ReturnType<SubscriptionService["simulate"]> {
    const parsed = simulateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    return this.subscriptionService.simulate(parsed.data as SubscriptionSimulationInput);
  }
}
