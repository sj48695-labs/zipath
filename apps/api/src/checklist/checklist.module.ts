import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChecklistTemplate, ChecklistItem } from "@zipath/db";
import { ChecklistController } from "./checklist.controller";
import { ChecklistService } from "./checklist.service";

@Module({
  imports: [TypeOrmModule.forFeature([ChecklistTemplate, ChecklistItem])],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
