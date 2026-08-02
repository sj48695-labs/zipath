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
  /** 검출되지 않은 필수 조항 라벨 목록 */
  missingRequired: string[];
  /** 검출되지 않은 권장 조항 라벨 목록 */
  missingRecommended: string[];
  riskLevel: "safe" | "caution" | "danger";
  riskSummary: string;
  disclaimer: string;
}

const EXTRACT_TEXT_SAMPLES: Record<string, string> = {
  월세:
    "부동산 임대차계약서. 임대인 홍길동, 임차인 김철수. 소재지 서울특별시 강남구. " +
    "보증금 일천만원(10,000,000원), 월세 50만원, 관리비 5만원. 계약기간 2년. 특약사항: 원상복구.",
  전세:
    "부동산 전세계약서. 임대인 홍길동, 임차인 김철수. 소재지 서울특별시 송파구. " +
    "전세금 삼억원(300,000,000원). 계약기간 2년. 보증금 반환은 계약 만료 시. 특약: 전세보증보험 가입.",
  매매:
    "부동산 매매계약서. 매도인 홍길동, 매수인 김철수. 소재지 서울특별시 마포구. " +
    "매매대금 오억원(500,000,000원). 계약금, 중도금, 잔금 일정. 소유권이전 등기는 잔금일.",
};

const ANALYSIS_DISCLAIMER =
  "본 분석은 참고용이며 법적 효력이 없습니다. OCR 인식 정확도에 따라 일부 조항이 누락 검출될 수 있으니, 실제 계약 시 반드시 공인중개사 또는 법률 전문가의 확인을 받으세요.";

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

  getAnalyzableTypes(): string[] {
    return [...ANALYZABLE_CONTRACT_TYPES];
  }

  /**
   * OCR로 추출된 계약서 텍스트에서 주요 조항을 검출하여 분석 결과를 반환한다.
   */
  analyzeText(type: string, text: string): ContractAnalysisResult {
    if (!isAnalyzableContractType(type)) {
      throw new BadRequestException(
        `분석 가능한 계약 유형이 아닙니다. (${ANALYZABLE_CONTRACT_TYPES.join(", ")} 중 선택)`,
      );
    }

    const normalized = text.trim();
    if (normalized.length === 0) {
      throw new BadRequestException("분석할 계약서 텍스트가 비어 있습니다.");
    }

    const haystack = normalized.replace(/\s+/g, "");
    const clauses: ClauseDetection[] = CLAUSE_KEYWORDS[type].map((clause) => {
      const matchedKeywords = clause.keywords.filter((kw) =>
        haystack.includes(kw.replace(/\s+/g, "")),
      );
      return {
        id: clause.id,
        label: clause.label,
        detected: matchedKeywords.length > 0,
        severity: clause.severity,
        matchedKeywords,
        advice: clause.advice,
      };
    });

    const detectedCount = clauses.filter((c) => c.detected).length;
    const missingRequired = clauses
      .filter((c) => c.severity === "required" && !c.detected)
      .map((c) => c.label);
    const missingRecommended = clauses
      .filter((c) => c.severity === "recommended" && !c.detected)
      .map((c) => c.label);

    let riskLevel: "safe" | "caution" | "danger" = "safe";
    if (missingRequired.length > 0) riskLevel = "danger";
    else if (missingRecommended.length > 0) riskLevel = "caution";

    const riskSummary =
      riskLevel === "danger"
        ? `필수 조항 ${missingRequired.length}개가 계약서에서 확인되지 않았습니다. 누락 여부를 반드시 점검하세요.`
        : riskLevel === "caution"
          ? "필수 조항은 확인되었으나, 권장 조항 일부가 누락되었습니다."
          : "주요 조항이 모두 계약서에서 확인되었습니다.";

    return {
      contractType: type,
      clauses,
      detectedCount,
      totalCount: clauses.length,
      missingRequired,
      missingRecommended,
      riskLevel,
      riskSummary,
      disclaimer: ANALYSIS_DISCLAIMER,
    };
  }

  /**
   * 업로드된 이미지 버퍼에서 텍스트를 추출한다.
   *
   * MVP에서는 실제 OCR 엔진을 내장하지 않고 데모용 시뮬레이션 텍스트를 생성한다.
   * (향후 외부 OCR API / 온디바이스 OCR로 이 메서드 내부만 교체하면 됨.)
   */
  extractText(_buffer: Buffer, type: string): string {
    return EXTRACT_TEXT_SAMPLES[type] ?? EXTRACT_TEXT_SAMPLES["월세"];
  }
}
