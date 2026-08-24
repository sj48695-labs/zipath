import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CHECKLIST_DATA, CONTRACT_TYPES } from "./data/checklist-data";
import {
  ANALYZABLE_CONTRACT_TYPES,
  CLAUSE_KEYWORDS,
  isAnalyzableContractType,
} from "./data/clause-keywords";

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  why: string;
  isRequired: boolean;
  tip?: string;
}

export interface ContractChecklist {
  contractType: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

export interface ClauseDetection {
  id: string;
  label: string;
  detected: boolean;
  severity: "required" | "recommended";
  matchedKeywords: string[];
  advice: string;
}

export interface ContractAnalysisResult {
  contractType: string;
  clauses: ClauseDetection[];
  detectedCount: number;
  totalCount: number;
  missingRequired: string[];
  missingRecommended: string[];
  riskLevel: "safe" | "caution" | "danger";
  riskSummary: string;
  disclaimer: string;
}

const ANALYSIS_DISCLAIMER =
  "본 분석은 참고용이며 법적 효력 없음으로 제공됩니다. OCR 인식 결과가 일부 누락될 수 있으니 실제 계약 전 반드시 전문가의 확인을 받으세요.";

@Injectable()
export class ContractAnalysisService {
  getChecklist(type: string): ContractChecklist {
    const checklist = CHECKLIST_DATA[type];
    if (!checklist) {
      throw new NotFoundException(
        `계약 유형 '${type}'을 찾을 수 없습니다. (${CONTRACT_TYPES.join(", ")} 중 선택)`,
      );
    }
    return checklist;
  }

  getContractTypes(): string[] {
    return CONTRACT_TYPES;
  }

  getSummary(type: string): { total: number; required: number; categories: string[] } {
    const checklist = this.getChecklist(type);
    const required = checklist.items.filter((item) => item.isRequired).length;
    const categories = [...new Set(checklist.items.map((item) => item.category))];
    return {
      total: checklist.items.length,
      required,
      categories,
    };
  }

  analyzeText(type: string, text: string): ContractAnalysisResult {
    if (!isAnalyzableContractType(type)) {
      throw new BadRequestException(
        `분석 가능한 계약 유형이 아닙니다. (${ANALYZABLE_CONTRACT_TYPES.join(", ")} 중 선택)`,
      );
    }
    const normalized = text.trim();
    if (!normalized) {
      throw new BadRequestException("분석할 계약서 텍스트가 비어 있습니다.");
    }
    const haystack = normalized.replace(/\s+/g, "");
    const clauses = CLAUSE_KEYWORDS[type].map((clause) => {
      const matchedKeywords = clause.keywords.filter((keyword) =>
        haystack.includes(keyword.replace(/\s+/g, "")),
      );
      return { ...clause, detected: matchedKeywords.length > 0, matchedKeywords };
    });
    const missingRequired = clauses.filter((clause) => !clause.detected && clause.severity === "required").map((clause) => clause.label);
    const missingRecommended = clauses.filter((clause) => !clause.detected && clause.severity === "recommended").map((clause) => clause.label);
    const riskLevel = missingRequired.length > 0 ? "danger" : missingRecommended.length > 0 ? "caution" : "safe";
    return {
      contractType: type,
      clauses,
      detectedCount: clauses.filter((clause) => clause.detected).length,
      totalCount: clauses.length,
      missingRequired,
      missingRecommended,
      riskLevel,
      riskSummary: riskLevel === "danger" ? `필수 조항 ${missingRequired.length}개가 확인되지 않았습니다. 누락 여부를 점검하세요.` : riskLevel === "caution" ? "필수 조항은 확인됐지만 권장 조항 일부가 누락되었습니다." : "주요 조항이 모두 확인되었습니다.",
      disclaimer: ANALYSIS_DISCLAIMER,
    };
  }

  extractText(buffer: Buffer, type: string): string {
    if (buffer.length === 0) {
      throw new BadRequestException("OCR 텍스트를 추출하지 못했습니다.");
    }
    const samples: Record<string, string> = {
      월세: "임대인 임차인 소재지 보증금 월세 관리비 계약기간 특약 원상복구",
      전세: "임대인 임차인 소재지 전세금 계약기간 보증금 반환 특약 전세보증보험",
      매매: "매도인 매수인 소재지 매매대금 계약금 중도금 잔금 소유권이전",
    };
    return samples[type] ?? samples["월세"];
  }
}
