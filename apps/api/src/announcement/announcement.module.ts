import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Announcement, SubscriptionCriteria } from "@zipath/db";
import { AnnouncementController } from "./announcement.controller";
import { AnnouncementService } from "./announcement.service";

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, SubscriptionCriteria])],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
})
export class AnnouncementModule {}
