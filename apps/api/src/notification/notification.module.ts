import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Announcement,
  Notification,
  NotificationPreference,
  PriceBaseline,
} from "@zipath/db";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { RealPriceModule } from "../real-price/real-price.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationPreference,
      Notification,
      PriceBaseline,
      Announcement,
    ]),
    RealPriceModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService],
  exports: [NotificationService],
})
export class NotificationModule {}
