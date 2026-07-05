import { Injectable } from "@nestjs/common";

interface ScoreTier {
  threshold: number;
  score: number;
}

// 각 카테고리: value >= threshold 인 첫 항목의 score (내림차순)
const HOMELESS_SCORE_TABLE: ScoreTier[] = [
  { threshold: 15, score: 32 },
  { threshold: 14, score: 28 },
  { threshold: 13, score: 26 },
  { threshold: 12, score: 24 },
  { threshold: 11, score: 22 },
  { threshold: 10, score: 20 },
  { threshold: 9, score: 18 },
  { threshold: 8, score: 16 },
  { threshold: 7, score: 14 },
  { threshold: 6, score: 12 },
  { threshold: 5, score: 10 },
  { threshold: 4, score: 8 },
  { threshold: 3, score: 6 },
  { threshold: 2, score: 4 },
  { threshold: 1, score: 2 },
];

const DEPENDENT_SCORE_TABLE: ScoreTier[] = [
  { threshold: 6, score: 35 },
  { threshold: 5, score: 25 },
  { threshold: 4, score: 20 },
  { threshold: 3, score: 15 },
  { threshold: 2, score: 10 },
  { threshold: 1, score: 5 },
];

const SAVINGS_SCORE_TABLE: ScoreTier[] = [
  { threshold: 15, score: 17 },
  { threshold: 14, score: 14 },
  { threshold: 13, score: 13 },
  { threshold: 12, score: 12 },
  { threshold: 11, score: 11 },
  { threshold: 10, score: 10 },
  { threshold: 9, score: 9 },
  { threshold: 8, score: 8 },
  { threshold: 7, score: 7 },
  { threshold: 6, score: 6 },
  { threshold: 5, score: 5 },
  { threshold: 4, score: 4 },
  { threshold: 3, score: 3 },
  { threshold: 2, score: 2 },
  { threshold: 1, score: 1 },
];

function lookupScore(table: ScoreTier[], value: number): number {
  return table.find((tier) => value >= tier.threshold)?.score ?? 0;
}

export interface SimulationInput {
  age: number;
  income: number;
  homelessMonths: number;
  dependents?: number;
  savingsMonths?: number;
  region?: string;
  isMarried?: boolean;
  isFirstHome?: boolean;
}

export interface PointBreakdown {
  category: string;
  score: number;
  maxScore: number;
  description: string;
}

@Injectable()
export class SubscriptionService {
  simulate(input: SimulationInput) {
    const { age, income, homelessMonths, dependents = 0, isMarried = false, isFirstHome = false } = input;
    const results = [];

    // 1순위 일반공급
    if (age >= 19 && homelessMonths >= 24) {
      if (income <= 6000) {
        results.push({ type: "1순위 일반공급", eligible: true, reason: "만 19세 이상, 무주택 2년 이상, 소득 기준 충족" });
      } else {
        results.push({ type: "1순위 일반공급", eligible: false, reason: `소득 기준 초과 (${income}만원 > 6,000만원)` });
      }
    } else {
      const reasons: string[] = [];
      if (age < 19) reasons.push("만 19세 미만");
      if (homelessMonths < 24) reasons.push(`무주택 기간 부족 (${homelessMonths}개월 < 24개월)`);
      results.push({ type: "1순위 일반공급", eligible: false, reason: reasons.join(", ") });
    }

    // 2순위
    if (age >= 19) {
      results.push({ type: "2순위", eligible: true, reason: "만 19세 이상 누구나 신청 가능 (당첨 확률 낮음)" });
    }

    // 특별공급 - 신혼부부
    if (isMarried && income <= 7000) {
      results.push({ type: "특별공급 (신혼부부)", eligible: true, reason: "혼인 상태 + 소득 기준 충족 (7,000만원 이하)" });
    } else if (isMarried && income > 7000) {
      results.push({ type: "특별공급 (신혼부부)", eligible: false, reason: `소득 기준 초과 (${income}만원 > 7,000만원)` });
    } else if (!isMarried) {
      results.push({ type: "특별공급 (신혼부부)", eligible: false, reason: "혼인 상태가 아닙니다" });
    }

    // 특별공급 - 생애최초
    if (isFirstHome && income <= 6000 && homelessMonths >= 0) {
      results.push({ type: "특별공급 (생애최초)", eligible: true, reason: "생애최초 주택 구입 + 소득 기준 충족" });
    } else if (!isFirstHome) {
      results.push({ type: "특별공급 (생애최초)", eligible: false, reason: "생애최초 주택 구입 대상이 아닙니다" });
    } else if (income > 6000) {
      results.push({ type: "특별공급 (생애최초)", eligible: false, reason: `소득 기준 초과 (${income}만원 > 6,000만원)` });
    }

    // 특별공급 - 다자녀
    if (dependents >= 3) {
      results.push({ type: "특별공급 (다자녀)", eligible: true, reason: `미성년 자녀 ${dependents}명 (3명 이상)` });
    }

    // 특별공급 - 노부모 부양
    if (dependents > 0 && age >= 25 && homelessMonths >= 36) {
      results.push({ type: "특별공급 (노부모부양)", eligible: true, reason: "만 25세 이상, 무주택 3년 이상, 부양가족 있음" });
    }

    // 가점 계산 (84점 만점)
    const points = this.calculatePoints(input);
    const totalPoints = points.reduce((sum, p) => sum + p.score, 0);
    const maxPoints = points.reduce((sum, p) => sum + p.maxScore, 0);

    return {
      input,
      results,
      points,
      totalPoints,
      maxPoints,
      message: results.some((r) => r.eligible)
        ? `청약 가능한 유형이 있습니다! (가점 ${totalPoints}/${maxPoints}점)`
        : "현재 조건으로는 청약 자격이 부족합니다.",
    };
  }

  private calculatePoints(input: SimulationInput): PointBreakdown[] {
    const { age, homelessMonths, dependents = 0, savingsMonths } = input;
    const points: PointBreakdown[] = [];

    // 1. 무주택 기간 (최대 32점)
    const homelessYears = Math.floor(homelessMonths / 12);
    points.push({
      category: "무주택 기간",
      score: lookupScore(HOMELESS_SCORE_TABLE, homelessYears),
      maxScore: 32,
      description: `무주택 ${homelessYears}년 (${homelessMonths}개월)`,
    });

    // 2. 부양가족 수 (최대 35점)
    points.push({
      category: "부양가족 수",
      score: lookupScore(DEPENDENT_SCORE_TABLE, dependents),
      maxScore: 35,
      description: `부양가족 ${dependents}명`,
    });

    // 3. 청약통장 가입기간 (최대 17점)
    const hasSavingsInput = savingsMonths !== undefined;
    const savingsYears = hasSavingsInput
      ? Math.floor(savingsMonths / 12)
      : Math.max(0, age - 19);
    points.push({
      category: "청약통장 가입기간",
      score: lookupScore(SAVINGS_SCORE_TABLE, savingsYears),
      maxScore: 17,
      description: hasSavingsInput
        ? `가입 ${savingsYears}년 (${savingsMonths}개월)`
        : `추정 가입기간 약 ${savingsYears}년 (만 19세부터 계산)`,
    });

    return points;
  }
}
