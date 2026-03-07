import { Module } from "@nestjs/common";
import { SubscriptionModule } from "./subscription/subscription.module";
import { LoanModule } from "./loan/loan.module";
import { ChecklistModule } from "./checklist/checklist.module";

@Module({
  imports: [SubscriptionModule, LoanModule, ChecklistModule],
})
export class AppModule {}
