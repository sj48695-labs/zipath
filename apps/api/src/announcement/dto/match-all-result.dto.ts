import { MatchResultDto } from "./match-result.dto";

/** 참고용 고지 (법적 효력 없음) */
export const MATCH_DISCLAIMER =
  "본 매칭 결과는 참고용이며 법적 효력이 없습니다. 정확한 자격은 청약 공고 및 관련 기관을 통해 확인하세요.";

export interface MatchAllResultDto {
  /** 지원 가능한 공고 수 */
  matchedCount: number;
  /** 지원 가능한 공고별 매칭 결과 */
  matches: MatchResultDto[];
  /** 참고용 고지 */
  disclaimer: string;
}
