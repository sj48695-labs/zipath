"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchApi, ApiError } from "@/lib/api";

type RiskLevel = "safe" | "caution" | "danger";

interface OwnershipItem {
  order: number;
  type: string;
  holder: string;
  date: string;
  cause: string;
}

interface RightItem {
  order: number;
  type: string;
  holder: string;
  amount: string | null;
  date: string;
  riskLevel: RiskLevel;
  explanation: string;
}

interface AnalysisResult {
  address: string;
  analysisDate: string;
  overallRisk: RiskLevel;
  riskSummary: string;
  gap: { items: OwnershipItem[]; summary: string };
  eul: { items: RightItem[]; summary: string };
  warnings: string[];
  tips: string[];
  disclaimer: string;
}

interface TermExplanation {
  term: string;
  description: string;
  detail: string;
}

const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  safe: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "안전" },
  caution: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "주의" },
  danger: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "위험" },
};

export default function RegistryPage() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [terms, setTerms] = useState<TermExplanation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchApi<AnalysisResult>(
        `/registry/analyze?address=${encodeURIComponent(address)}`,
      );
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("서버에 연결할 수 없습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async () => {
    if (terms.length > 0) {
      setShowTerms(!showTerms);
      return;
    }
    try {
      const data = await fetchApi<TermExplanation[]>("/registry/terms");
      setTerms(data);
      setShowTerms(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">등기부등본 분석</h1>
        <p className="mb-8 text-muted-foreground">
          주소를 입력하면 등기부등본을 분석하여 위험 요소를 알려드립니다.
        </p>

        <form onSubmit={handleAnalyze} className="flex gap-3">
          <input
            type="text"
            placeholder="주소를 입력하세요 (예: 서울시 강남구 역삼동 123)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "분석 중..." : "분석하기"}
          </button>
        </form>

        <button
          onClick={loadTerms}
          className="mt-4 text-sm text-primary underline hover:no-underline"
        >
          {showTerms ? "용어 설명 닫기" : "등기부등본 용어 알아보기"}
        </button>

        {showTerms && terms.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {terms.map((t) => (
              <div key={t.term} className="rounded-lg border p-4">
                <h3 className="font-semibold">{t.term}</h3>
                <p className="text-sm text-primary">{t.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.detail}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {/* 종합 위험도 */}
            <div className={`rounded-lg border p-6 ${riskColors[result.overallRisk].bg} ${riskColors[result.overallRisk].border}`}>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${riskColors[result.overallRisk].text} ${riskColors[result.overallRisk].bg}`}>
                  {riskColors[result.overallRisk].label}
                </span>
                <div>
                  <h2 className="font-semibold">종합 위험도 분석</h2>
                  <p className="text-sm text-muted-foreground">{result.riskSummary}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">분석일: {result.analysisDate}</p>
            </div>

            {/* 갑구 */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-1 text-lg font-semibold">갑구 (소유권 관련)</h2>
              <p className="mb-4 text-sm text-muted-foreground">{result.gap.summary}</p>
              <div className="space-y-2">
                {result.gap.items.map((item) => (
                  <div key={item.order} className="flex items-center gap-4 rounded-md bg-gray-50 p-3 text-sm">
                    <span className="shrink-0 font-mono text-muted-foreground">#{item.order}</span>
                    <div className="flex-1">
                      <span className="font-medium">{item.type}</span>
                      <span className="ml-2 text-muted-foreground">({item.cause})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 을구 */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-1 text-lg font-semibold">을구 (권리 설정)</h2>
              <p className="mb-4 text-sm text-muted-foreground">{result.eul.summary}</p>
              <div className="space-y-3">
                {result.eul.items.map((item) => {
                  const risk = riskColors[item.riskLevel];
                  return (
                    <div key={item.order} className={`rounded-md border p-4 ${risk.bg} ${risk.border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${risk.text}`}>
                            {risk.label}
                          </span>
                          <span className="font-medium">{item.type}</span>
                        </div>
                        {item.amount && (
                          <span className="text-sm font-semibold">{item.amount}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm">{item.explanation}</p>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span>권리자: {item.holder}</span>
                        <span>설정일: {item.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 경고 사항 */}
            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h2 className="mb-3 font-semibold text-red-800">주의사항</h2>
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm text-red-700">
                      <span className="shrink-0">!</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 팁 */}
            <div className="rounded-lg border p-6">
              <h2 className="mb-3 font-semibold">계약 전 체크 포인트</h2>
              <ul className="space-y-2">
                {result.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0 text-primary">*</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* 법적 고지 */}
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
