import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  NotificationPreference,
  Notification,
  RealPriceCache,
  Announcement,
} from "@zipath/db";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationPreference,
      Notification,
      RealPriceCache,
      Announcement,
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService],
  exports: [NotificationService],
})
export class NotificationModule {}
