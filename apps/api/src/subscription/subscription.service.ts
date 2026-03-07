import { Injectable } from "@nestjs/common";

interface SimulationInput {
  age: number;
  income: number;
  homelessMonths: number;
  region?: string;
}

@Injectable()
export class SubscriptionService {
  simulate(input: SimulationInput) {
    const { age, income, homelessMonths } = input;
    const results = [];

    // 1순위 판별 (간소화된 로직)
    if (age >= 19 && homelessMonths >= 24) {
      if (income <= 6000) {
        results.push({ type: "1순위 일반", eligible: true, reason: "기본 자격 충족" });
      } else {
        results.push({ type: "1순위 일반", eligible: false, reason: "소득 기준 초과" });
      }
    } else {
      results.push({ type: "1순위 일반", eligible: false, reason: "나이 또는 무주택 기간 미충족" });
    }

    // 특별공급 - 신혼부부 (간소화)
    if (income <= 7000) {
      results.push({ type: "특별공급 (신혼부부)", eligible: true, reason: "소득 기준 충족" });
    }

    // 특별공급 - 생애최초
    if (homelessMonths >= 0 && income <= 6000) {
      results.push({ type: "특별공급 (생애최초)", eligible: true, reason: "무주택 + 소득 기준 충족" });
    }

    return {
      input,
      results,
      message: results.some((r) => r.eligible)
        ? "청약 가능한 유형이 있습니다!"
        : "현재 조건으로는 청약 자격이 부족합니다.",
    };
  }
}
