"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Announcement {
  HOUSE_MANAGE_NO: string;
  PBLANC_NO: string;
  HOUSE_NM: string;
  HOUSE_SECD_NM: string;
  SUPPLY_LCTN_NM: string;
  TOT_SUPLY_HSHLDCO: number;
  RCRIT_PBLANC_DE: string;
  RCEPT_BGNDE: string;
  RCEPT_ENDDE: string;
  PRZWNER_PRESNATN_DE: string;
  HSSPLY_ADRES: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/announcements?pageNo=${page}&numOfRows=10`
        );
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        const items =
          data?.response?.body?.items ?? data?.body?.items ?? [];
        setAnnouncements(Array.isArray(items) ? items : []);
      } catch {
        setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page]);

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
            <p className="mt-2 text-sm text-red-600">
              data.go.kr API 키가 설정되어 있는지 확인해주세요.
            </p>
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
                  key={`${item.HOUSE_MANAGE_NO}-${item.PBLANC_NO}`}
                  className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.HOUSE_SECD_NM || "APT"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          공고번호 {item.PBLANC_NO}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {item.HOUSE_NM}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.HSSPLY_ADRES || item.SUPPLY_LCTN_NM}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {item.TOT_SUPLY_HSHLDCO}세대
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      모집공고일: {item.RCRIT_PBLANC_DE || "-"}
                    </span>
                    <span>
                      접수기간: {item.RCEPT_BGNDE || "-"} ~{" "}
                      {item.RCEPT_ENDDE || "-"}
                    </span>
                    <span>
                      당첨자발표: {item.PRZWNER_PRESNATN_DE || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                이전
              </button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {page} 페이지
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
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
