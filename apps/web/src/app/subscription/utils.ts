import type { SubscriptionSimulationInput } from "@zipath/types";

export interface SubscriptionFormState {
  age: string;
  income: string;
  homelessMonths: string;
  dependents: string;
  savingsYears: string;
  savingsMonths: string;
  isMarried: boolean;
  isFirstHome: boolean;
}

export function buildSubscriptionSimulationInput(
  form: SubscriptionFormState,
): SubscriptionSimulationInput {
  return {
    age: Number(form.age),
    income: Number(form.income),
    homelessMonths: Number(form.homelessMonths),
    dependents: form.dependents ? Number(form.dependents) : 0,
    savingsYears: Number(form.savingsYears),
    savingsMonths: Number(form.savingsMonths),
    isMarried: form.isMarried,
    isFirstHome: form.isFirstHome,
  };
}
