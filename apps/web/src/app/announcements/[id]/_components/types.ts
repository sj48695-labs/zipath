export interface AnnouncementDetail {
  id: number;
  title: string;
  region: string;
  supplyType: string;
  startDate: string;
  endDate: string;
  detailUrl: string | null;
  summary: string | null;
  rawData: Record<string, unknown> | null;
}

export interface MatchCriterionResult {
  criterion: string;
  eligible: boolean;
  reason: string;
}

export interface MatchResult {
  announcementId: number;
  announcementTitle: string;
  overallEligible: boolean;
  results: MatchCriterionResult[];
  message: string;
}

export interface MatchFormData {
  age: string;
  income: string;
  homelessMonths: string;
  dependents: string;
  region: string;
  isMarried: boolean;
  isFirstHome: boolean;
}
