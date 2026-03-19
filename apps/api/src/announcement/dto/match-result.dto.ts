export interface MatchCriterionResult {
  criterion: string;
  eligible: boolean;
  reason: string;
}

export interface MatchResultDto {
  announcementId: number;
  announcementTitle: string;
  overallEligible: boolean;
  results: MatchCriterionResult[];
  message: string;
}
