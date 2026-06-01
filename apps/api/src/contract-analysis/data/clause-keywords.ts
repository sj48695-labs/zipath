/**
 * 계약서 조항 검출 키워드 매핑
 *
 * OCR로 추출한 계약서 텍스트에서 주요 조항이 명시되어 있는지 판정하기 위한
 * 키워드 맵. 계약 유형(월세/전세/매매)별로 검출 대상 조항을 정의한다.
 *
 * checklist-data.ts 의 카테고리(보증금/특약/계약기간/확정일자 등)와 정합되도록 작성.
 */

export type ContractType = "월세" | "전세" | "매매";

export interface ClauseKeyword {
  /** 조항 식별자 */
  id: string;
  /** 조항 이름 (UI 표기용) */
  label: string;
  /** 텍스트에서 이 조항을 검출하기 위한 키워드 목록 (하나라도 매칭되면 검출) */
  keywords: string[];
  /**
   * 조항 중요도.
   * - required: 계약서에 반드시 명시되어야 하는 필수 조항 (누락 시 위험)
   * - recommended: 명시하면 좋은 권장 조항 (누락 시 주의)
   */
  severity: "required" | "recommended";
  /** 해당 조항에 대한 안내/조언 */
  advice: string;
}

const COMMON_CLAUSES: ClauseKeyword[] = [
  {
    id: "deposit",
    label: "보증금 금액",
    keywords: ["보증금", "임차보증금", "전세금"],
    severity: "required",
    advice: "보증금 금액이 숫자와 한글로 정확히 기재되어 있는지 확인하세요.",
  },
  {
    id: "parties",
    label: "임대인/임차인 정보",
    keywords: ["임대인", "임차인", "매도인", "매수인", "성명", "주민등록번호"],
    severity: "required",
    advice: "계약 당사자의 인적사항이 정확히 기재되어야 합니다.",
  },
  {
    id: "property",
    label: "목적물 표시(소재지)",
    keywords: ["소재지", "주소", "목적물", "부동산의 표시"],
    severity: "required",
    advice: "계약 대상 부동산의 소재지와 면적이 등기부등본과 일치하는지 확인하세요.",
  },
  {
    id: "special-terms",
    label: "특약사항",
    keywords: ["특약", "특약사항"],
    severity: "recommended",
    advice: "구두 약속은 효력이 약합니다. 중요한 약속은 특약으로 명시하세요.",
  },
];

const WOLSE_CLAUSES: ClauseKeyword[] = [
  ...COMMON_CLAUSES,
  {
    id: "monthly-rent",
    label: "월세 금액",
    keywords: ["월세", "차임", "월 차임"],
    severity: "required",
    advice: "월세 금액과 지급일이 명확히 기재되어 있는지 확인하세요.",
  },
  {
    id: "maintenance-fee",
    label: "관리비",
    keywords: ["관리비"],
    severity: "recommended",
    advice: "관리비 금액과 포함 항목(수도·인터넷 등)을 확인하세요.",
  },
  {
    id: "contract-period",
    label: "계약 기간",
    keywords: ["계약기간", "임대차기간", "임대차 기간", "존속기간"],
    severity: "required",
    advice: "계약 기간(시작일~종료일)이 명확한지 확인하세요. (보통 2년)",
  },
  {
    id: "restoration",
    label: "원상복구 조항",
    keywords: ["원상복구", "원상회복"],
    severity: "recommended",
    advice: "퇴거 시 원상복구 범위를 특약으로 명확히 하세요.",
  },
];

const JEONSE_CLAUSES: ClauseKeyword[] = [
  ...COMMON_CLAUSES,
  {
    id: "contract-period",
    label: "계약 기간",
    keywords: ["계약기간", "임대차기간", "임대차 기간", "존속기간"],
    severity: "required",
    advice: "전세 계약 기간(보통 2년)과 갱신 조건을 확인하세요.",
  },
  {
    id: "deposit-return",
    label: "보증금 반환 조건",
    keywords: ["보증금 반환", "반환", "반환시기", "반환 시기"],
    severity: "required",
    advice: "계약 만료 시 보증금 반환 시기와 방법이 명시되어 있는지 확인하세요.",
  },
  {
    id: "mortgage",
    label: "근저당/선순위 권리",
    keywords: ["근저당", "선순위", "담보"],
    severity: "recommended",
    advice: "선순위 근저당이 있으면 깡통전세 위험을 확인하세요.",
  },
  {
    id: "insurance",
    label: "전세보증보험 특약",
    keywords: ["전세보증보험", "보증보험", "보증금반환보증", "HUG"],
    severity: "recommended",
    advice: "전세보증보험 가입 가능 여부를 사전에 확인하세요.",
  },
];

const MAEMAE_CLAUSES: ClauseKeyword[] = [
  ...COMMON_CLAUSES,
  {
    id: "sale-price",
    label: "매매대금",
    keywords: ["매매대금", "매매금액", "매매 대금"],
    severity: "required",
    advice: "매매대금이 숫자와 한글로 정확히 기재되어 있는지 확인하세요.",
  },
  {
    id: "payment-schedule",
    label: "계약금/중도금/잔금 일정",
    keywords: ["계약금", "중도금", "잔금"],
    severity: "required",
    advice: "계약금·중도금·잔금의 금액과 지급일이 명확한지 확인하세요.",
  },
  {
    id: "ownership-transfer",
    label: "소유권 이전 등기",
    keywords: ["소유권이전", "소유권 이전", "이전등기", "이전 등기"],
    severity: "required",
    advice: "잔금일에 소유권 이전 등기가 진행되는지 확인하세요.",
  },
  {
    id: "defect-liability",
    label: "하자담보책임",
    keywords: ["하자", "하자담보", "하자 보수"],
    severity: "recommended",
    advice: "기존 하자에 대한 보수 책임 범위를 특약으로 정하세요.",
  },
];

export const CLAUSE_KEYWORDS: Record<ContractType, ClauseKeyword[]> = {
  월세: WOLSE_CLAUSES,
  전세: JEONSE_CLAUSES,
  매매: MAEMAE_CLAUSES,
};

export const ANALYZABLE_CONTRACT_TYPES = Object.keys(
  CLAUSE_KEYWORDS,
) as ContractType[];

export function isAnalyzableContractType(type: string): type is ContractType {
  return ANALYZABLE_CONTRACT_TYPES.includes(type as ContractType);
}
