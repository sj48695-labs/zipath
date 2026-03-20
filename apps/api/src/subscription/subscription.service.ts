import { Injectable } from "@nestjs/common";

export interface SimulationInput {
  age: number;
  income: number;
  homelessMonths: number;
  dependents?: number;
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
    const { homelessMonths, dependents = 0, age } = input;
    const points: PointBreakdown[] = [];

    // 1. 무주택 기간 (최대 32점)
    const homelessYears = Math.floor(homelessMonths / 12);
    let homelessScore = 0;
    if (homelessYears >= 1) homelessScore = 2;
    if (homelessYears >= 2) homelessScore = 4;
    if (homelessYears >= 3) homelessScore = 6;
    if (homelessYears >= 4) homelessScore = 8;
    if (homelessYears >= 5) homelessScore = 10;
    if (homelessYears >= 6) homelessScore = 12;
    if (homelessYears >= 7) homelessScore = 14;
    if (homelessYears >= 8) homelessScore = 16;
    if (homelessYears >= 9) homelessScore = 18;
    if (homelessYears >= 10) homelessScore = 20;
    if (homelessYears >= 11) homelessScore = 22;
    if (homelessYears >= 12) homelessScore = 24;
    if (homelessYears >= 13) homelessScore = 26;
    if (homelessYears >= 14) homelessScore = 28;
    if (homelessYears >= 15) homelessScore = 32;

    points.push({
      category: "무주택 기간",
      score: homelessScore,
      maxScore: 32,
      description: `무주택 ${homelessYears}년 (${homelessMonths}개월)`,
    });

    // 2. 부양가족 수 (최대 35점)
    let dependentScore = 0;
    if (dependents >= 1) dependentScore = 5;
    if (dependents >= 2) dependentScore = 10;
    if (dependents >= 3) dependentScore = 15;
    if (dependents >= 4) dependentScore = 20;
    if (dependents >= 5) dependentScore = 25;
    if (dependents >= 6) dependentScore = 35;

    points.push({
      category: "부양가족 수",
      score: dependentScore,
      maxScore: 35,
      description: `부양가족 ${dependents}명`,
    });

    // 3. 청약통장 가입기간 (최대 17점) - 나이를 근사치로 활용
    // 실제로는 청약통장 가입기간이 필요하지만, 나이로 추정
    const estimatedSavingsYears = Math.max(0, age - 19);
    let savingsScore = 0;
    if (estimatedSavingsYears >= 1) savingsScore = 1;
    if (estimatedSavingsYears >= 2) savingsScore = 2;
    if (estimatedSavingsYears >= 3) savingsScore = 3;
    if (estimatedSavingsYears >= 4) savingsScore = 4;
    if (estimatedSavingsYears >= 5) savingsScore = 5;
    if (estimatedSavingsYears >= 6) savingsScore = 6;
    if (estimatedSavingsYears >= 7) savingsScore = 7;
    if (estimatedSavingsYears >= 8) savingsScore = 8;
    if (estimatedSavingsYears >= 9) savingsScore = 9;
    if (estimatedSavingsYears >= 10) savingsScore = 10;
    if (estimatedSavingsYears >= 11) savingsScore = 11;
    if (estimatedSavingsYears >= 12) savingsScore = 12;
    if (estimatedSavingsYears >= 13) savingsScore = 13;
    if (estimatedSavingsYears >= 14) savingsScore = 14;
    if (estimatedSavingsYears >= 15) savingsScore = 17;

    points.push({
      category: "청약통장 가입기간",
      score: savingsScore,
      maxScore: 17,
      description: `추정 가입기간 약 ${estimatedSavingsYears}년 (만 19세부터 계산)`,
    });

    return points;
  }
}
