import { Injectable } from "@nestjs/common";

export interface LoanInput {
  annualIncome: number;
  existingDebt: number;
  housePrice: number;
  loanTermYears?: number;
}

@Injectable()
export class LoanService {
  calculate(input: LoanInput) {
    const { annualIncome, existingDebt, housePrice, loanTermYears = 30 } = input;

    // LTV (주택담보대출비율) - 일반적으로 70%
    const ltvRatio = 0.7;
    const maxByLtv = housePrice * ltvRatio;

    // DSR (총부채원리금상환비율) - 40% 기준
    const dsrLimit = 0.4;
    const annualRepaymentCapacity = annualIncome * dsrLimit;
    const existingAnnualRepayment = existingDebt > 0 ? existingDebt / 10 : 0; // 기존 대출 연상환 추정
    const availableAnnualRepayment = annualRepaymentCapacity - existingAnnualRepayment;

    // 연이율 4% 가정, 원리금균등상환
    const annualRate = 0.04;
    const monthlyRate = annualRate / 12;
    const totalMonths = loanTermYears * 12;

    const maxByDsr =
      availableAnnualRepayment > 0
        ? (availableAnnualRepayment / 12) *
          ((Math.pow(1 + monthlyRate, totalMonths) - 1) /
            (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)))
        : 0;

    const maxLoanAmount = Math.max(0, Math.min(maxByLtv, maxByDsr));
    const monthlyPayment =
      maxLoanAmount > 0
        ? (maxLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1)
        : 0;

    return {
      input,
      result: {
        maxByLtv: Math.round(maxByLtv),
        maxByDsr: Math.round(Math.max(0, maxByDsr)),
        maxLoanAmount: Math.round(maxLoanAmount),
        monthlyPayment: Math.round(monthlyPayment),
        annualRate: `${(annualRate * 100).toFixed(1)}%`,
        loanTermYears,
        dsrRatio: `${(dsrLimit * 100).toFixed(0)}%`,
        ltvRatio: `${(ltvRatio * 100).toFixed(0)}%`,
      },
    };
  }
}
