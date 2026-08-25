import { Controller, Get, Query } from "@nestjs/common";
import { ContractAnalysisService } from "./contract-analysis.service";

@Controller("contract-analysis")
export class ContractAnalysisController {
  constructor(
    private readonly contractAnalysisService: ContractAnalysisService,
  ) {}

  @Get("checklist")
  getChecklist(@Query("type") type: string) {
    return this.contractAnalysisService.getChecklist(type);
  }

  @Get("types")
  getContractTypes() {
    return { types: this.contractAnalysisService.getContractTypes() };
  }

  @Get("summary")
  getSummary(@Query("type") type: string) {
    return this.contractAnalysisService.getSummary(type);
  }
}
