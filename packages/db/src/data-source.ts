import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { RealPriceCache } from "./entities/real-price-cache.entity";
import { Announcement } from "./entities/announcement.entity";
import { SubscriptionCriteria } from "./entities/subscription-criteria.entity";
import { ChecklistTemplate } from "./entities/checklist-template.entity";
import { ChecklistItem } from "./entities/checklist-item.entity";

export const entities = [
  User,
  RealPriceCache,
  Announcement,
  SubscriptionCriteria,
  ChecklistTemplate,
  ChecklistItem,
];

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  entities,
  synchronize: process.env.NODE_ENV !== "production",
});
