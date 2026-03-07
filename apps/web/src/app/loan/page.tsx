"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoanPage() {
  const [form, setForm] = useState({
    annualIncome: "",
    existingDebt: "",
    housePrice: "",
  });
  const [result, setResult] = useState<{
    maxLoanAmount: number;
    monthlyPayment: number;
    maxByLtv: number;
    maxByDsr: number;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const income = Number(form.annualIncome);
    const debt = Number(form.existingDebt);
    const price = Number(form.housePrice);

    const ltvRatio = 0.7;
    const dsrLimit = 0.4;
    const annualRate = 0.04;
    const months = 360;
    const monthlyRate = annualRate / 12;

    const maxByLtv = price * ltvRatio;
    const annualCapacity = income * dsrLimit;
    const existingRepayment = debt > 0 ? debt / 10 : 0;
    const available = annualCapacity - existingRepayment;

    const maxByDsr =
      available > 0
        ? (available / 12) *
          ((Math.pow(1 + monthlyRate, months) - 1) /
            (monthlyRate * Math.pow(1 + monthlyRate, months)))
        : 0;

    const maxLoan = Math.max(0, Math.min(maxByLtv, maxByDsr));
    const monthly =
      maxLoan > 0
        ? (maxLoan * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1)
        : 0;

    setResult({
      maxLoanAmount: Math.round(maxLoan),
      monthlyPayment: Math.round(monthly),
      maxByLtv: Math.round(maxByLtv),
      maxByDsr: Math.round(Math.max(0, maxByDsr)),
    });
  };

  const formatMoney = (n: number) => n.toLocaleString("ko-KR");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">대출 한도 계산기</h1>
        <p className="mb-8 text-muted-foreground">
          연소득과 주택 가격을 기반으로 대출 가능 금액을 계산해드려요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">연소득 (만원)</label>
            <input
              type="number"
              placeholder="연소득을 만원 단위로 입력하세요"
              value={form.annualIncome}
              onChange={(e) => setForm({ ...form, annualIncome: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">기존 대출 잔액 (만원)</label>
            <input
              type="number"
              placeholder="0"
              value={form.existingDebt}
              onChange={(e) => setForm({ ...form, existingDebt: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">주택 가격 (만원)</label>
            <input
              type="number"
              placeholder="주택 가격을 만원 단위로 입력하세요"
              value={form.housePrice}
              onChange={(e) => setForm({ ...form, housePrice: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            계산하기
          </button>
        </form>

        {result && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">계산 결과</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">최대 대출 가능 금액</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMoney(result.maxLoanAmount)}만원
                </p>
              </div>
              <div className="rounded-md bg-secondary p-4">
                <p className="text-sm text-muted-foreground">월 상환 예상액</p>
                <p className="text-2xl font-bold">{formatMoney(result.monthlyPayment)}만원</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">LTV 기준 한도 (70%)</p>
                <p className="font-semibold">{formatMoney(result.maxByLtv)}만원</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">DSR 기준 한도 (40%)</p>
                <p className="font-semibold">{formatMoney(result.maxByDsr)}만원</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              * 연이율 4.0%, 원리금균등상환 30년 기준 산출. 실제 대출 조건은 금융기관에 따라 다릅니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
