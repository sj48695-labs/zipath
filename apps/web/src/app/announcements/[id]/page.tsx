"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface AnnouncementDetail {
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

interface MatchCriterionResult {
  criterion: string;
  eligible: boolean;
  reason: string;
}

interface MatchResult {
  announcementId: number;
  announcementTitle: string;
  overallEligible: boolean;
  results: MatchCriterionResult[];
  message: string;
}

interface MatchFormData {
  age: string;
  income: string;
  homelessMonths: string;
  dependents: string;
  region: string;
  isMarried: boolean;
  isFirstHome: boolean;
}

export default function AnnouncementDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MatchFormData>({
    age: "",
    income: "",
    homelessMonths: "",
    dependents: "",
    region: "",
    isMarried: false,
    isFirstHome: false,
  });
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/announcements/${id}`);
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? `오류가 발생했습니다. (${res.status})`);
          return;
        }
        const data: AnnouncementDetail = await res.json();
        setAnnouncement(data);
      } catch {
        setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDetail();
    }
  }, [id]);

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function isActive(endDate: string) {
    return new Date(endDate) >= new Date();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

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
        <Link
          href="/announcements"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; 공고 목록으로
        </Link>

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

        {!loading && !error && announcement && (
          <>
            {/* 공고 상세 정보 */}
            <div className="mb-8 rounded-lg border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {announcement.supplyType}
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {announcement.region}
                </span>
                {isActive(announcement.endDate) ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    접수중
                  </span>
                ) : (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    마감
                  </span>
                )}
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
                    {formatDate(announcement.startDate)} ~{" "}
                    {formatDate(announcement.endDate)}
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
            </div>

            {/* 원본 데이터 */}
            {announcement.rawData &&
              Object.keys(announcement.rawData).length > 0 && (
                <div className="mb-8 rounded-lg border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">원본 데이터</h2>
                  <div className="overflow-x-auto">
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
                </div>
              )}

            {/* 자격 확인 섹션 */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-2 text-lg font-semibold">자격 확인</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                나의 정보를 입력하면 이 공고에 지원 가능한지 확인할 수 있습니다.
              </p>

              <form onSubmit={handleMatchSubmit} className="mb-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="age"
                      className="mb-1 block text-sm font-medium"
                    >
                      나이 (만)
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min="0"
                      max="150"
                      required
                      placeholder="예: 30"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="income"
                      className="mb-1 block text-sm font-medium"
                    >
                      월 소득 (만원)
                    </label>
                    <input
                      id="income"
                      name="income"
                      type="number"
                      min="0"
                      required
                      placeholder="예: 3500"
                      value={formData.income}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="homelessMonths"
                      className="mb-1 block text-sm font-medium"
                    >
                      무주택 기간 (개월)
                    </label>
                    <input
                      id="homelessMonths"
                      name="homelessMonths"
                      type="number"
                      min="0"
                      required
                      placeholder="예: 36"
                      value={formData.homelessMonths}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dependents"
                      className="mb-1 block text-sm font-medium"
                    >
                      부양가족 수{" "}
                      <span className="text-muted-foreground">(선택)</span>
                    </label>
                    <input
                      id="dependents"
                      name="dependents"
                      type="number"
                      min="0"
                      placeholder="본인 제외"
                      value={formData.dependents}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="region"
                      className="mb-1 block text-sm font-medium"
                    >
                      거주 지역{" "}
                      <span className="text-muted-foreground">(선택)</span>
                    </label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      placeholder="예: 서울"
                      value={formData.region}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.isMarried}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isMarried: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    혼인 상태
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.isFirstHome}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isFirstHome: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    생애최초 주택 구입
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={matchLoading}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {matchLoading ? "확인 중..." : "자격 확인하기"}
                </button>
              </form>

              {matchError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">
                    {matchError}
                  </p>
                </div>
              )}

              {matchResult && (
                <div className="space-y-4">
                  <div
                    className={`rounded-lg border p-4 ${
                      matchResult.overallEligible
                        ? "border-green-200 bg-green-50"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        matchResult.overallEligible
                          ? "text-green-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {matchResult.message}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {matchResult.results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <span
                          className={`mt-0.5 shrink-0 text-lg ${
                            result.eligible
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {result.eligible ? "O" : "X"}
                        </span>
                        <div>
                          <p className="font-medium">{result.criterion}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    * 본 결과는 참고용이며 법적 효력이 없습니다. 정확한 자격
                    여부는 청약홈에서 확인해주세요.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
