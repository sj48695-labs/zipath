import { Controller, Get, Param } from "@nestjs/common";
import { ChecklistService } from "./checklist.service";

@Controller("checklist")
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get(":type")
  getChecklist(@Param("type") type: string) {
    return this.checklistService.getByType(type);
  }
}
