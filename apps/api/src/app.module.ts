import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { join } from "path";
import { entities } from "@zipath/db";
import { SubscriptionModule } from "./subscription/subscription.module";
import { LoanModule } from "./loan/loan.module";
import { ChecklistModule } from "./checklist/checklist.module";
import { CleanupModule } from "./cleanup/cleanup.module";
import { HealthModule } from "./health/health.module";
import { RealPriceModule } from "./real-price/real-price.module";
import { GlossaryModule } from "./glossary/glossary.module";
import { AuthModule } from "./auth/auth.module";
import { AnnouncementModule } from "./announcement/announcement.module";
import { ContractAnalysisModule } from "./contract-analysis/contract-analysis.module";
import { NotificationModule } from "./notification/notification.module";
import { RegistryModule } from "./registry/registry.module";
import { PaymentModule } from "./payment/payment.module";
import { envValidationSchema, envValidationOptions } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>("NODE_ENV") === "production";
        // 마이그레이션 파일은 @zipath/db 패키지의 dist/migrations 에 위치.
        // 빌드 후 monorepo node_modules 에서 패키지를 resolve 해서 경로를 만든다.
        const dbPkgDir = require.resolve("@zipath/db/package.json").replace(/\/package\.json$/, "");
        return {
          type: "postgres" as const,
          url: config.get<string>("DATABASE_URL"),
          ssl: isProd ? { rejectUnauthorized: false } : false,
          entities,
          synchronize: !isProd,
          migrationsRun: isProd,
          migrations: [join(dbPkgDir, "dist/migrations/*.js")],
          migrationsTableName: "_migrations",
        };
      },
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 10 },   // 10 req/sec
      { name: "medium", ttl: 60000, limit: 100 }, // 100 req/min
    ]),
    ScheduleModule.forRoot(),
    SubscriptionModule,
    LoanModule,
    ChecklistModule,
    CleanupModule,
    HealthModule,
    RealPriceModule,
    GlossaryModule,
    AuthModule,
    AnnouncementModule,
    ContractAnalysisModule,
    NotificationModule,
    RegistryModule,
    PaymentModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
