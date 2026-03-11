"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  example?: string;
}

const CATEGORIES = ["전체", "등기", "계약", "대출", "청약", "세금", "기타"];

export default function GlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApi<{ terms: GlossaryTerm[] }>("/glossary")
      .then((data) => setTerms(data.terms))
      .catch(() => setError("용어 데이터를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = terms.filter((t) => {
    const matchCategory =
      activeCategory === "전체" || t.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/subscription" className="hover:text-foreground">청약</Link>
            <Link href="/loan" className="hover:text-foreground">대출</Link>
            <Link href="/checklist" className="hover:text-foreground">체크리스트</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">부동산 용어 사전</h1>
        <p className="mb-8 text-muted-foreground">
          부동산 초보자를 위한 필수 용어를 쉽게 설명합니다.
        </p>

        {/* 검색 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="용어 또는 설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((t) => (
              <div
                key={t.term}
                className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm"
              >
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{t.term}</h3>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {t.category}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {t.definition}
                </p>
                {t.example && (
                  <div className="mt-3 rounded-md bg-secondary/50 px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">예시: </span>
                      {t.example}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              총 {filtered.length}개 용어
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
