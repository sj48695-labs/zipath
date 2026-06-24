"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import { fetchApi, ApiError } from "@/lib/api";

/** 콜드 스타트 안내를 노출하기 시작하는 경과 시간(초). */
const COLD_START_HINT_SECONDS = 10;

/** 청약 자격 확인 요청 안전 타임아웃(ms). 초과 시 408 로 변환된다. */
const REQUEST_TIMEOUT_MS = 45_000;

interface SimulationPayload {
  age: number;
  income: number;
  homelessMonths: number;
  dependents: number;
  isMarried: boolean;
  isFirstHome: boolean;
}

interface SimulationResult {
  type: string;
  eligible: boolean;
  reason: string;
}

interface PointBreakdown {
  category: string;
  score: number;
  maxScore: number;
  description: string;
}

interface SimulationResponse {
  results: SimulationResult[];
  points: PointBreakdown[];
  totalPoints: number;
  maxPoints: number;
  message: string;
}

export default function SubscriptionPage() {
  const [form, setForm] = useState({
    age: "",
    income: "",
    homelessMonths: "",
    dependents: "",
    isMarried: false,
    isFirstHome: false,
  });
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const lastPayloadRef = useRef<SimulationPayload | null>(null);

  // loading 동안 1초 간격으로 경과 시간을 추적, 종료 시 정리.
  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [loading]);

  const showColdStartHint = loading && elapsedSeconds >= COLD_START_HINT_SECONDS;

  const runSimulation = async (payload: SimulationPayload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchApi<SimulationResponse>(
        "/subscription/simulate",
        {
          method: "POST",
          timeoutMs: REQUEST_TIMEOUT_MS,
          body: JSON.stringify(payload),
        },
      );
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        // 408(타임아웃)은 콜드 스타트 맥락으로 다듬어 재시도를 유도.
        setError(
          err.status === 408
            ? "서버가 잠시 준비 중이에요. 잠시 후 다시 시도해주세요."
            : err.message,
        );
      } else {
        setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SimulationPayload = {
      age: Number(form.age),
      income: Number(form.income),
      homelessMonths: Number(form.homelessMonths),
      dependents: form.dependents ? Number(form.dependents) : 0,
      isMarried: form.isMarried,
      isFirstHome: form.isFirstHome,
    };
    lastPayloadRef.current = payload;
    void runSimulation(payload);
  };

  const handleRetry = () => {
    if (lastPayloadRef.current) {
      void runSimulation(lastPayloadRef.current);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-3xl" />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">청약 자격 시뮬레이션</h1>
        <p className="mb-8 text-muted-foreground">
          기본 정보를 입력하면 청약 가능 여부와 예상 가점을 확인할 수 있어요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">나이</label>
              <input
                type="number"
                placeholder="만 나이"
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
                placeholder="연소득"
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
                placeholder="개월 수"
                value={form.homelessMonths}
                onChange={(e) => setForm({ ...form, homelessMonths: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">부양가족 수</label>
              <input
                type="number"
                placeholder="본인 제외"
                value={form.dependents}
                onChange={(e) => setForm({ ...form, dependents: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isMarried}
                onChange={(e) => setForm({ ...form, isMarried: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              혼인 상태
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFirstHome}
                onChange={(e) => setForm({ ...form, isFirstHome: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              생애최초 주택 구입
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {!loading
              ? "자격 확인하기"
              : showColdStartHint
                ? "서버 준비 중..."
                : "확인 중..."}
          </button>
        </form>

        {showColdStartHint && (
          <div
            className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6"
            aria-live="polite"
          >
            <p className="text-sm text-amber-700">
              서버가 잠시 준비 중입니다 (콜드 스타트). 보통 30초 이내에 응답해요.
              잠시만 기다려주세요. (경과 {elapsedSeconds}초)
            </p>
          </div>
        )}

        {error && (
          <div
            className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6"
            role="alert"
          >
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              다시 시도
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-8 space-y-6" aria-hidden="true">
            <div className="rounded-lg border p-6">
              <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-md bg-gray-100" />
                <div className="h-16 animate-pulse rounded-md bg-gray-100" />
              </div>
            </div>
            <div className="rounded-lg border p-6">
              <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="space-y-4">
                <div className="h-2 animate-pulse rounded-full bg-gray-100" />
                <div className="h-2 animate-pulse rounded-full bg-gray-100" />
                <div className="h-2 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border p-6">
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

            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-lg font-semibold">
                예상 가점: {result.totalPoints}점 / {result.maxPoints}점
              </h2>
              <div className="space-y-4">
                {result.points.map((p, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{p.category}</span>
                      <span className="text-muted-foreground">
                        {p.score} / {p.maxScore}점
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(p.score / p.maxScore) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * 가점은 참고용이며 실제 청약 시 청약통장 가입기간, 납입 횟수 등에 따라 달라질 수 있습니다.
            </p>
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          * 본 시뮬레이션 결과는 참고용이며 법적 효력이 없습니다.
        </p>
      </main>
    </div>
  );
}
