import { Module } from "@nestjs/common";
import { ContractAnalysisController } from "./contract-analysis.controller";
import { ContractAnalysisService } from "./contract-analysis.service";

@Module({
  controllers: [ContractAnalysisController],
  providers: [ContractAnalysisService],
})
export class ContractAnalysisModule {}
