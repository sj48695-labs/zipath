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

// 청약 시뮬레이션
export interface SubscriptionSimulationInput {
  age: number;
  income: number; // 만원 단위
  homelessMonths: number;
  region?: string;
}

export interface SubscriptionResult {
  type: string;
  eligible: boolean;
  reason: string;
}

export interface SubscriptionSimulationResponse {
  input: SubscriptionSimulationInput;
  results: SubscriptionResult[];
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
