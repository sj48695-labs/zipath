"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  why: string;
  isRequired: boolean;
  tip?: string;
}

interface ContractChecklist {
  contractType: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

type ContractType = "월세" | "전세" | "매매";

const CONTRACT_TYPES: { type: ContractType; label: string; description: string; color: string }[] = [
  {
    type: "월세",
    label: "월세",
    description: "보증금 + 매달 월세를 내는 임대 계약",
    color: "bg-blue-50 border-blue-300 hover:border-blue-400",
  },
  {
    type: "전세",
    label: "전세",
    description: "보증금만 맡기고 거주하는 임대 계약",
    color: "bg-green-50 border-green-300 hover:border-green-400",
  },
  {
    type: "매매",
    label: "매매",
    description: "주택을 구매하는 매매 계약",
    color: "bg-orange-50 border-orange-300 hover:border-orange-400",
  },
];

export default function ContractAnalysisPage() {
  const [selectedType, setSelectedType] = useState<ContractType | null>(null);
  const [checklist, setChecklist] = useState<ContractChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchChecklist = useCallback(async (type: ContractType) => {
    setLoading(true);
    setError(null);
    setChecked(new Set());
    setExpandedItem(null);
    try {
      const data = await fetchApi<ContractChecklist>(
        `/contract-analysis/checklist?type=${encodeURIComponent(type)}`,
      );
      setChecklist(data);
    } catch {
      setError("체크리스트를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchChecklist(selectedType);
    }
  }, [selectedType, fetchChecklist]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItem((prev) => (prev === id ? null : id));
  };

  const total = checklist?.items.length ?? 0;
  const done = checked.size;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  const requiredItems = checklist?.items.filter((item) => item.isRequired) ?? [];
  const requiredDone = requiredItems.filter((item) => checked.has(item.id)).length;
  const categories = checklist
    ? [...new Set(checklist.items.map((item) => item.category))]
    : [];

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/checklist" className="hover:text-foreground">
              체크리스트
            </Link>
            <Link href="/glossary" className="hover:text-foreground">
              용어사전
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">계약서 분석 체크리스트</h1>
        <p className="mb-8 text-muted-foreground">
          계약 유형을 선택하면 확인해야 할 항목과 그 이유를 자세히 알려드립니다.
        </p>

        {/* 법적 고지 */}
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          이 체크리스트는 참고용이며 법적 효력이 없습니다. 실제 계약 시에는
          반드시 전문가(공인중개사, 변호사)의 조언을 받으세요.
        </div>

        {/* 계약 유형 선택 */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">계약 유형 선택</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CONTRACT_TYPES.map((ct) => (
              <button
                key={ct.type}
                onClick={() => setSelectedType(ct.type)}
                className={`rounded-lg border-2 p-5 text-left transition-all ${ct.color} ${
                  selectedType === ct.type
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
              >
                <h3 className="mb-1 text-xl font-bold">{ct.label}</h3>
                <p className="text-sm text-muted-foreground">{ct.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">{error}</p>
            <button
              onClick={() => selectedType && fetchChecklist(selectedType)}
              className="mt-3 text-sm text-red-600 underline hover:text-red-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 체크리스트 */}
        {!loading && !error && checklist && (
          <>
            {/* 진행률 */}
            <div className="mb-8 rounded-lg border bg-card p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold">{checklist.title}</h2>
                <span className="text-2xl font-bold text-primary">
                  {percentage}%
                </span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {checklist.description}
              </p>
              <div className="mb-2 h-3 rounded-full bg-secondary">
                <div
                  className="h-3 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  전체: {done}/{total} 완료
                </span>
                <span>
                  필수: {requiredDone}/{requiredItems.length} 완료
                </span>
              </div>
            </div>

            {/* 카테고리별 항목 */}
            <div className="space-y-8">
              {categories.map((category) => {
                const categoryItems = checklist.items.filter(
                  (item) => item.category === category,
                );
                const categoryDone = categoryItems.filter((item) =>
                  checked.has(item.id),
                ).length;

                return (
                  <div key={category}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {categoryDone}/{categoryItems.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {categoryItems.map((item) => {
                        const isChecked = checked.has(item.id);
                        const isExpanded = expandedItem === item.id;

                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border transition-all ${
                              isChecked
                                ? "border-primary/30 bg-primary/5"
                                : "bg-card hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-3 p-4">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCheck(item.id)}
                                className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-medium ${
                                      isChecked
                                        ? "line-through text-muted-foreground"
                                        : ""
                                    }`}
                                  >
                                    {item.title}
                                  </span>
                                  {item.isRequired && (
                                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                                      필수
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleExpand(item.id)}
                                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                aria-label={isExpanded ? "접기" : "자세히 보기"}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={`transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </button>
                            </div>

                            {/* 상세 설명 (확장) */}
                            {isExpanded && (
                              <div className="border-t px-4 pb-4 pt-3">
                                <div className="mb-3 rounded-md bg-blue-50 px-4 py-3">
                                  <p className="text-sm font-medium text-blue-900">
                                    왜 확인해야 하나요?
                                  </p>
                                  <p className="mt-1 text-sm text-blue-800">
                                    {item.why}
                                  </p>
                                </div>
                                {item.tip && (
                                  <div className="rounded-md bg-secondary/50 px-4 py-3">
                                    <p className="text-sm font-medium text-foreground">
                                      Tip
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {item.tip}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 완료 메시지 */}
            {percentage === 100 && (
              <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                <p className="text-lg font-bold text-green-800">
                  모든 항목을 확인했습니다!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  안전한 계약을 위해 전문가 상담도 받아보세요.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
