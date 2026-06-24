"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  formatDotDate,
  getTodayKey,
  isDateOnOrAfterToday,
} from "@/lib/dateFormat";

import MatchForm from "./_components/MatchForm";
import MatchResultPanel from "./_components/MatchResultPanel";
import type {
  AnnouncementDetail,
  MatchFormData,
  MatchResult,
} from "./_components/types";

const INITIAL_FORM: MatchFormData = {
  age: "",
  income: "",
  homelessMonths: "",
  dependents: "",
  region: "",
  isMarried: false,
  isFirstHome: false,
};

export default function AnnouncementDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState("");

  const [formData, setFormData] = useState<MatchFormData>(INITIAL_FORM);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTodayKey(getTodayKey());

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/announcements/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? `오류가 발생했습니다. (${res.status})`);
          return;
        }
        const data: AnnouncementDetail = await res.json();
        setAnnouncement(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
    return () => controller.abort();
  }, [id]);

  async function handleMatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMatchLoading(true);
    setMatchError(null);
    setMatchResult(null);

    const age = parseInt(formData.age, 10);
    const income = parseFloat(formData.income);
    const homelessMonths = parseInt(formData.homelessMonths, 10);

    if (isNaN(age) || isNaN(income) || isNaN(homelessMonths)) {
      setMatchError("나이, 소득, 무주택 기간을 올바르게 입력해주세요.");
      setMatchLoading(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        age,
        income,
        homelessMonths,
        dependents: formData.dependents ? parseInt(formData.dependents, 10) : 0,
        isMarried: formData.isMarried,
        isFirstHome: formData.isFirstHome,
      };
      if (formData.region.trim()) {
        body.region = formData.region.trim();
      }

      const res = await fetch(`/api/announcements/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
        } | null;
        setMatchError(
          data?.message ?? data?.error ?? `오류가 발생했습니다. (${res.status})`,
        );
        return;
      }

      const data: MatchResult = await res.json();
      setMatchResult(data);
    } catch {
      setMatchError("자격 확인 요청에 실패했습니다.");
    } finally {
      setMatchLoading(false);
    }
  }

  const active = announcement && todayKey
    ? isDateOnOrAfterToday(announcement.endDate, todayKey)
    : null;

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-5xl" />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/announcements"
          aria-label="공고 목록 페이지로 돌아가기"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; 공고 목록으로
        </Link>

        {loading && (
          <div role="status" className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="sr-only">로딩 중</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
          >
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && announcement && (
          <>
            {active === false && (
              <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-medium text-yellow-800">
                  이 공고는 마감되었습니다. 자격 확인은 참고용으로만 사용하세요.
                </p>
              </div>
            )}

            <div className="mb-8 rounded-lg border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {announcement.supplyType}
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {announcement.region}
                </span>
                {active !== null &&
                  (active ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      접수중
                    </span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      마감
                    </span>
                  ))}
              </div>

              <h1 className="mb-4 text-2xl font-bold">{announcement.title}</h1>

              {announcement.summary && (
                <p className="mb-6 text-muted-foreground">
                  {announcement.summary}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">
                    접수 기간
                  </p>
                  <p className="font-medium">
                    {formatDotDate(announcement.startDate)} ~{" "}
                    {formatDotDate(announcement.endDate)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">지역</p>
                  <p className="font-medium">{announcement.region}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">
                    공급 유형
                  </p>
                  <p className="font-medium">{announcement.supplyType}</p>
                </div>
                {announcement.detailUrl && (
                  <div className="rounded-lg border p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      원문 링크
                    </p>
                    <a
                      href={announcement.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      청약홈에서 보기
                    </a>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                * 본 정보는 참고용이며 법적 효력이 없습니다. 정확한 내용은
                청약홈 원문을 확인해주세요.
              </p>
            </div>

            {announcement.rawData &&
              Object.keys(announcement.rawData).length > 0 && (
                <details className="mb-8 rounded-lg border bg-card p-6">
                  <summary className="cursor-pointer text-lg font-semibold">
                    원문 데이터 보기
                  </summary>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(announcement.rawData).map(
                          ([key, value]) => (
                            <tr key={key} className="border-b last:border-b-0">
                              <td className="whitespace-nowrap py-2 pr-4 font-medium text-muted-foreground">
                                {key}
                              </td>
                              <td className="py-2">
                                {value === null || value === undefined
                                  ? "-"
                                  : String(value)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-2 text-lg font-semibold">자격 확인</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                나의 정보를 입력하면 이 공고에 지원 가능한지 확인할 수 있습니다.
              </p>

              <MatchForm
                value={formData}
                onChange={setFormData}
                onSubmit={handleMatchSubmit}
                loading={matchLoading}
                submitLabel={
                  active
                    ? "자격 확인하기"
                    : "참고용 자격 확인"
                }
              />

              <MatchResultPanel result={matchResult} error={matchError} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
