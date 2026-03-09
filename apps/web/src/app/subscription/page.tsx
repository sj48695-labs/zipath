"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchApi, ApiError } from "@/lib/api";

interface SimulationResult {
  type: string;
  eligible: boolean;
  reason: string;
}

interface SimulationResponse {
  results: SimulationResult[];
  message: string;
}

export default function SubscriptionPage() {
  const [form, setForm] = useState({ age: "", income: "", homelessMonths: "" });
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchApi<SimulationResponse>(
        "/subscription/simulate",
        {
          method: "POST",
          body: JSON.stringify({
            age: Number(form.age),
            income: Number(form.income),
            homelessMonths: Number(form.homelessMonths),
          }),
        },
      );
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="mb-2 text-3xl font-bold">청약 자격 시뮬레이션</h1>
        <p className="mb-8 text-muted-foreground">
          기본 정보를 입력하면 청약 가능 여부를 확인할 수 있어요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">나이</label>
            <input
              type="number"
              placeholder="만 나이를 입력하세요"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">연소득 (만원)</label>
            <input
              type="number"
              placeholder="연소득을 만원 단위로 입력하세요"
              value={form.income}
              onChange={(e) => setForm({ ...form, income: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">무주택 기간 (개월)</label>
            <input
              type="number"
              placeholder="무주택 기간을 개월 수로 입력하세요"
              value={form.homelessMonths}
              onChange={(e) => setForm({ ...form, homelessMonths: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "확인 중..." : "자격 확인하기"}
          </button>
        </form>

        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">{result.message}</h2>
            <div className="space-y-3">
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-md p-4 ${r.eligible ? "bg-green-50 border border-green-200" : "bg-gray-50 border"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.type}</span>
                    <span
                      className={`text-sm font-medium ${r.eligible ? "text-green-600" : "text-gray-500"}`}
                    >
                      {r.eligible ? "가능" : "불가"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
