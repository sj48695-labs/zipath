"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface AnnouncementItem {
  id: number;
  title: string;
  region: string;
  supplyType: string;
  startDate: string;
  endDate: string;
  detailUrl: string | null;
  summary: string | null;
  rawData: Record<string, unknown> | null;
}

interface ApiResponse {
  items: AnnouncementItem[];
  totalCount: number;
  page: number;
  limit: number;
  error?: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/announcements?pageNo=${page}&numOfRows=${limit}`,
        );
        const data: ApiResponse = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setAnnouncements(data.items ?? []);
        setTotalCount(data.totalCount ?? 0);
      } catch {
        setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page]);

  const totalPages = Math.ceil(totalCount / limit);

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function isActive(endDate: string) {
    return new Date(endDate) >= new Date();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Zipath
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/subscription" className="hover:text-foreground">
              청약
            </Link>
            <Link href="/loan" className="hover:text-foreground">
              대출
            </Link>
            <Link href="/checklist" className="hover:text-foreground">
              체크리스트
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">공공분양 공고</h1>
        <p className="mb-8 text-muted-foreground">
          청약홈에서 제공하는 최신 APT 분양 공고 목록입니다.
        </p>

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

        {!loading && !error && announcements.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            등록된 공고가 없습니다.
          </div>
        )}

        {!loading && announcements.length > 0 && (
          <>
            <div className="grid gap-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.supplyType}
                        </span>
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          {item.region}
                        </span>
                        {isActive(item.endDate) ? (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            접수중
                          </span>
                        ) : (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            마감
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/announcements/${item.id}`}
                        className="text-lg font-semibold hover:text-primary hover:underline"
                      >
                        {item.title}
                      </Link>
                      {item.summary && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    {item.detailUrl && (
                      <a
                        href={item.detailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border px-3 py-1.5 text-xs hover:bg-accent"
                      >
                        상세보기
                      </a>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>접수시작: {formatDate(item.startDate)}</span>
                    <span>접수마감: {formatDate(item.endDate)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-4 text-sm text-muted-foreground">
                {page} / {totalPages || 1} 페이지 (총 {totalCount}건)
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
