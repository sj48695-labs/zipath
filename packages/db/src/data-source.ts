import "reflect-metadata";
import { join } from "path";
import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { RealPriceCache } from "./entities/real-price-cache.entity";
import { Announcement } from "./entities/announcement.entity";
import { SubscriptionCriteria } from "./entities/subscription-criteria.entity";
import { ChecklistTemplate } from "./entities/checklist-template.entity";
import { ChecklistItem } from "./entities/checklist-item.entity";
import { NotificationPreference } from "./entities/notification-preference.entity";
import { Notification } from "./entities/notification.entity";
import { Payment } from "./entities/payment.entity";

export const entities = [
  User,
  RealPriceCache,
  Announcement,
  SubscriptionCriteria,
  ChecklistTemplate,
  ChecklistItem,
  NotificationPreference,
  Notification,
  Payment,
];

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  entities,
  // production: 마이그레이션으로 스키마 관리. 부팅 시 자동 실행.
  // dev: synchronize 로 빠른 반복. 마이그레이션은 generate 시점에만 사용.
  synchronize: !isProd,
  migrationsRun: isProd,
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  migrationsTableName: "_migrations",
});
