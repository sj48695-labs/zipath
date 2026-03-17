"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface ChecklistItem {
  category: string;
  content: string;
  isRequired: boolean;
}

interface ChecklistData {
  title: string;
  items: ChecklistItem[];
}

export default function ChecklistDetailPage() {
  const params = useParams();
  const type = params.type as string;

  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchApi<ChecklistData>(`/checklist/${type}`)
      .then((data) => setChecklist(data))
      .catch(() => setError("체크리스트를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error ?? "존재하지 않는 체크리스트입니다."}</p>
      </div>
    );
  }

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const total = checklist.items.length;
  const done = checked.size;
  const percentage = Math.round((done / total) * 100);

  const categories = [...new Set(checklist.items.map((i) => i.category))];

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/checklist" className="text-sm text-muted-foreground hover:text-foreground">
            체크리스트
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">{checklist.title}</h1>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {done}/{total} 완료
            </span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Items by category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h2>
              <div className="space-y-2">
                {checklist.items
                  .map((item, index) => ({ ...item, index }))
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <label
                      key={item.index}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        checked.has(item.index) ? "bg-primary/5 border-primary/30" : "hover:bg-secondary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(item.index)}
                        onChange={() => toggle(item.index)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                      />
                      <span
                        className={`text-sm ${checked.has(item.index) ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.content}
                        {item.isRequired && (
                          <span className="ml-1 text-xs text-red-500">*필수</span>
                        )}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
