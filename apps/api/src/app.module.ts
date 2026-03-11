import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { entities } from "@zipath/db";
import { SubscriptionModule } from "./subscription/subscription.module";
import { LoanModule } from "./loan/loan.module";
import { ChecklistModule } from "./checklist/checklist.module";
import { CleanupModule } from "./cleanup/cleanup.module";
import { HealthModule } from "./health/health.module";
import { RealPriceModule } from "./real-price/real-price.module";
import { GlossaryModule } from "./glossary/glossary.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.get<string>("DATABASE_URL"),
        ssl:
          config.get<string>("NODE_ENV") === "production"
            ? { rejectUnauthorized: false }
            : false,
        entities,
        synchronize: config.get<string>("NODE_ENV") !== "production",
      }),
    }),
    ScheduleModule.forRoot(),
    SubscriptionModule,
    LoanModule,
    ChecklistModule,
    CleanupModule,
    HealthModule,
    RealPriceModule,
    GlossaryModule,
    AuthModule,
  ],
})
export class AppModule {}
