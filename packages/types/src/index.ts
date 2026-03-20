// 유저
export type SsoProvider = "google" | "kakao" | "naver";

export interface UserProfile {
  id: number;
  email: string | null;
  nickname: string | null;
  provider: SsoProvider | null;
  createdAt: string;
  lastActiveAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string | null;
    nickname: string | null;
    provider: string | null;
  };
}

export interface OAuthLoginInput {
  provider: SsoProvider;
  providerId: string;
  email: string | null;
  nickname: string | null;
}

// 청약 시뮬레이션
export interface SubscriptionSimulationInput {
  age: number;
  income: number; // 만원 단위
  homelessMonths: number;
  dependents?: number; // 부양가족 수
  region?: string;
  isMarried?: boolean; // 혼인 여부
  isFirstHome?: boolean; // 생애최초 여부
}

export interface SubscriptionResult {
  type: string;
  eligible: boolean;
  reason: string;
}

export interface SubscriptionPointBreakdown {
  category: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface SubscriptionSimulationResponse {
  input: SubscriptionSimulationInput;
  results: SubscriptionResult[];
  points: SubscriptionPointBreakdown[];
  totalPoints: number;
  maxPoints: number;
  message: string;
}

// 대출 계산
export interface LoanCalculationInput {
  annualIncome: number; // 만원 단위
  existingDebt: number; // 만원 단위
  housePrice: number; // 만원 단위
  loanTermYears?: number;
}

export interface LoanCalculationResult {
  maxByLtv: number;
  maxByDsr: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  annualRate: string;
  loanTermYears: number;
  dsrRatio: string;
  ltvRatio: string;
}

export interface LoanCalculationResponse {
  input: LoanCalculationInput;
  result: LoanCalculationResult;
}

// 체크리스트
export type ChecklistType = "rent" | "jeonse" | "buy";

export interface ChecklistItem {
  category: string;
  content: string;
  isRequired: boolean;
}

export interface Checklist {
  title: string;
  items: ChecklistItem[];
}

// 실거래가
export type DealType = "매매" | "전세" | "월세";

export interface RealPriceSearchInput {
  regionCode: string;
  yearMonth: string; // YYYYMM
  dealType?: DealType;
}

export interface RealPriceTrade {
  aptNm: string;
  dealAmount: string;
  buildYear: string;
  dealYear: string;
  dealMonth: string;
  dealDay: string;
  excluUseAr: string;
  floor: string;
  umdNm: string;
  jibun: string;
  roadNm: string;
}

export interface RealPriceResponse {
  trades: RealPriceTrade[];
  totalCount: number;
  cached: boolean;
  regionCode: string;
  yearMonth: string;
}

export interface MonthlyPriceSummary {
  yearMonth: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  tradeCount: number;
}

export interface RealPriceTrendResponse {
  regionCode: string;
  fromMonth: string;
  toMonth: string;
  monthly: MonthlyPriceSummary[];
}

// 부동산 용어
export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  example?: string;
}

export type GlossaryCategory =
  | "등기"
  | "계약"
  | "대출"
  | "청약"
  | "세금"
  | "기타";

// 등기부등본
export type RegistryRiskLevel = "safe" | "caution" | "danger";

export interface RegistryOwnership {
  order: number;
  type: string; // 소유권이전, 소유권보존 등
  holder: string;
  date: string;
  cause: string; // 매매, 상속, 증여 등
}

export interface RegistryRightItem {
  order: number;
  type: string; // 근저당권, 전세권, 가압류, 가처분 등
  holder: string;
  amount: string | null;
  date: string;
  riskLevel: RegistryRiskLevel;
  explanation: string; // 쉬운 설명
}

export interface RegistryAnalysis {
  address: string;
  analysisDate: string;
  overallRisk: RegistryRiskLevel;
  riskSummary: string;
  gap: {
    items: RegistryOwnership[];
    summary: string;
  };
  eul: {
    items: RegistryRightItem[];
    summary: string;
  };
  warnings: string[];
  tips: string[];
  disclaimer: string;
}

// 결제
export type PaymentStatus = "pending" | "confirmed" | "failed" | "cancelled";
export type ProductType = "contract-analysis" | "real-price-report" | "premium-monthly";

export interface PaymentProduct {
  id: string;
  name: string;
  price: number;
}

export interface PaymentRecord {
  id: number;
  userId: number;
  amount: number;
  productType: string;
  status: PaymentStatus;
  paidAt: string;
}
