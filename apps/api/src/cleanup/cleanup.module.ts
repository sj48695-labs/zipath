import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RealPriceCache, Announcement, User } from "@zipath/db";
import { CleanupService } from "./cleanup.service";

@Module({
  imports: [TypeOrmModule.forFeature([RealPriceCache, Announcement, User])],
  providers: [CleanupService],
})
export class CleanupModule {}
