export type ContractType = "월세" | "전세" | "매매";

export interface ClauseKeyword {
  id: string;
  label: string;
  keywords: string[];
  severity: "required" | "recommended";
  advice: string;
}

const common: ClauseKeyword[] = [
  { id: "deposit", label: "보증금 금액", keywords: ["보증금", "임차보증금", "전세금"], severity: "required", advice: "보증금 금액이 정확히 기재되어 있는지 확인하세요." },
  { id: "parties", label: "계약 당사자 정보", keywords: ["임대인", "임차인", "매도인", "매수인"], severity: "required", advice: "계약 당사자의 인적사항을 확인하세요." },
  { id: "property", label: "목적물 표시(소재지)", keywords: ["소재지", "주소", "목적물"], severity: "required", advice: "계약 대상 부동산의 소재지를 등기부와 대조하세요." },
  { id: "special-terms", label: "특약사항", keywords: ["특약", "특약사항"], severity: "recommended", advice: "중요한 약속은 특약으로 명시하세요." },
];

export const CLAUSE_KEYWORDS: Record<ContractType, ClauseKeyword[]> = {
  월세: [...common,
    { id: "monthly-rent", label: "월세 금액", keywords: ["월세", "차임"], severity: "required", advice: "월세 금액과 지급일을 확인하세요." },
    { id: "maintenance-fee", label: "관리비", keywords: ["관리비"], severity: "recommended", advice: "관리비 항목을 확인하세요." },
    { id: "contract-period", label: "계약 기간", keywords: ["계약기간", "임대차기간"], severity: "required", advice: "계약 기간을 확인하세요." },
    { id: "restoration", label: "원상복구 조항", keywords: ["원상복구", "원상회복"], severity: "recommended", advice: "원상복구 범위를 확인하세요." },
  ],
  전세: [...common,
    { id: "contract-period", label: "계약 기간", keywords: ["계약기간", "임대차기간"], severity: "required", advice: "계약 기간을 확인하세요." },
    { id: "deposit-return", label: "보증금 반환 조건", keywords: ["보증금 반환", "반환시기", "반환"], severity: "required", advice: "보증금 반환 시기와 방법을 확인하세요." },
    { id: "mortgage", label: "근저당/선순위 권리", keywords: ["근저당", "선순위", "담보"], severity: "recommended", advice: "선순위 권리를 확인하세요." },
    { id: "insurance", label: "전세보증보험 특약", keywords: ["전세보증보험", "보증보험", "HUG"], severity: "recommended", advice: "보증보험 가입 가능 여부를 확인하세요." },
  ],
  매매: [...common,
    { id: "sale-price", label: "매매대금", keywords: ["매매대금", "매매금액"], severity: "required", advice: "매매대금을 확인하세요." },
    { id: "payment-schedule", label: "계약금/중도금/잔금 일정", keywords: ["계약금", "중도금", "잔금"], severity: "required", advice: "지급 일정과 금액을 확인하세요." },
    { id: "ownership-transfer", label: "소유권 이전 등기", keywords: ["소유권이전", "이전등기"], severity: "required", advice: "소유권 이전 등기 시점을 확인하세요." },
    { id: "defect-liability", label: "하자담보책임", keywords: ["하자", "하자담보"], severity: "recommended", advice: "하자 책임 범위를 확인하세요." },
  ],
};

export const ANALYZABLE_CONTRACT_TYPES = Object.keys(CLAUSE_KEYWORDS) as ContractType[];

export function isAnalyzableContractType(type: string): type is ContractType {
  return ANALYZABLE_CONTRACT_TYPES.includes(type as ContractType);
}
