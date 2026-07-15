"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  formatDotDate,
  formatKoreanDateTime,
  getTodayKey,
  isDateOnOrAfterToday,
} from "@/lib/dateFormat";
import LegalDisclaimer from "./_components/LegalDisclaimer";

const CHEONGYAKHOME_URL = "https://www.applyhome.co.kr/";

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
  lastSyncedAt?: string | null;
  error?: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [regionInput, setRegionInput] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [todayKey, setTodayKey] = useState("");
  const limit = 10;
  const hasRegionFilter = regionFilter.trim().length > 0;

  function applyRegionFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    setRegionFilter(regionInput.trim());
  }

  function clearRegionFilter() {
    setRegionInput("");
    setRegionFilter("");
    setPage(1);
  }

  function reloadAnnouncements() {
    setReloadToken((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    setTodayKey(getTodayKey());

    async function fetchData() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        pageNo: String(page),
        numOfRows: String(limit),
      });
      if (hasRegionFilter) {
        params.set("region", regionFilter.trim());
      }

      try {
        const res = await fetch(`/api/announcements?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => null)) as ApiResponse | null;

        if (!res.ok) {
          setError(data?.error ?? `오류가 발생했습니다. (${res.status})`);
          setAnnouncements([]);
          setTotalCount(0);
          setLastSyncedAt(null);
          return;
        }

        if (data?.error) {
          setError(data.error);
          setAnnouncements([]);
          setTotalCount(0);
          setLastSyncedAt(null);
          return;
        }

        setAnnouncements(data?.items ?? []);
        setTotalCount(data?.totalCount ?? 0);
        setLastSyncedAt(data?.lastSyncedAt ?? null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("데이터를 불러오는 데 실패했습니다.");
        setAnnouncements([]);
        setTotalCount(0);
        setLastSyncedAt(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, [hasRegionFilter, limit, page, regionFilter, reloadToken]);

  const totalPages = Math.ceil(totalCount / limit);
  const showNoDataState = !loading && !error && announcements.length === 0 && !hasRegionFilter;
  const showFilteredEmptyState =
    !loading && !error && announcements.length === 0 && hasRegionFilter;

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-5xl" />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">공공분양 공고</h1>
        <p className="mb-8 text-muted-foreground">
          청약홈에서 제공하는 최신 APT 분양 공고 목록입니다.
        </p>
        <div className="mb-6">
          <LegalDisclaimer />
        </div>

        <section className="mb-6 rounded-lg border bg-card p-4">
          <form
            onSubmit={applyRegionFilter}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="region-filter"
                className="mb-1 block text-sm font-medium"
              >
                지역 필터
              </label>
              <input
                id="region-filter"
                name="region-filter"
                type="text"
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                placeholder="예: 서울"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                청약홈에 표시된 지역명과 동일하게 입력하면 해당 지역만
                볼 수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                필터 적용
              </button>
              <button
                type="button"
                onClick={clearRegionFilter}
                disabled={!hasRegionFilter && !regionInput}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                필터 초기화
              </button>
            </div>
          </form>
          {hasRegionFilter && (
            <p className="mt-3 text-sm text-muted-foreground">
              현재 필터: {regionFilter}
            </p>
          )}
        </section>

        {loading && (
          <div role="status" aria-live="polite" className="grid gap-4">
            <span className="sr-only">공고를 불러오는 중</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="animate-pulse rounded-lg border bg-card p-6"
              >
                <div className="mb-3 flex gap-2">
                  <div className="h-5 w-16 rounded bg-muted" />
                  <div className="h-5 w-12 rounded bg-muted" />
                </div>
                <div className="mb-2 h-6 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="mt-4 flex gap-6">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
          >
            <p className="font-medium text-red-800">{error}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={reloadAnnouncements}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                다시 시도
              </button>
              <a
                href={CHEONGYAKHOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                청약홈에서 직접 확인하기
              </a>
            </div>
          </div>
        )}

        {showNoDataState && (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-lg font-medium">현재 등록된 공고가 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {lastSyncedAt
                ? `현재 저장된 공고가 없어요. 마지막 동기화: ${formatKoreanDateTime(lastSyncedAt)}`
                : "아직 동기화된 공고 정보가 없습니다. 잠시 후 다시 확인하거나 청약홈 원문을 살펴보세요."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={reloadAnnouncements}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
              >
                다시 불러오기
              </button>
              <a
                href={CHEONGYAKHOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                청약홈에서 직접 확인하기
              </a>
            </div>
          </div>
        )}

        {showFilteredEmptyState && (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-lg font-medium">선택한 지역의 공고가 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              현재 {regionFilter} 지역에 맞는 공고가 없습니다. 지역명을
              바꾸거나 필터를 지워 전체 목록을 확인해보세요.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={clearRegionFilter}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
              >
                필터 초기화
              </button>
              <a
                href={CHEONGYAKHOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                청약홈에서 직접 확인하기
              </a>
            </div>
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
                        {todayKey &&
                          (isDateOnOrAfterToday(item.endDate, todayKey) ? (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              접수중
                            </span>
                          ) : (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              마감
                            </span>
                          ))}
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
                    <span>접수시작: {formatDotDate(item.startDate)}</span>
                    <span>접수마감: {formatDotDate(item.endDate)}</span>
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
