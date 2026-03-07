import { Controller, Post, Body } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";

@Controller("subscription")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post("simulate")
  simulate(@Body() body: { age: number; income: number; homelessMonths: number; region?: string }) {
    return this.subscriptionService.simulate(body);
  }
}
