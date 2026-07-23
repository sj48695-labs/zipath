"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import AreaFilter from "./AreaFilter";
import SupportedRegionNotice from "./SupportedRegionNotice";
import { formatWonAmount } from "../_lib/formatWonAmount";
import { REGIONS } from "../_lib/regions";
import {
  type RealPriceMonthDefaults,
} from "../_lib/monthOptions";
import { useRealPriceMonthDefaults } from "../_lib/useRealPriceMonthDefaults";

const MonthlyPriceTrendChart = dynamic(
  () => import("./MonthlyPriceTrendChart"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        차트를 불러오는 중입니다.
      </div>
    ),
  },
);

const RealPriceCharts = dynamic(() => import("./RealPriceCharts"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border p-6 text-center text-muted-foreground">
      차트를 불러오는 중입니다.
    </div>
  ),
});

interface Trade {
  aptNm: string;
  dealAmount: string;
  buildYear: string;
  dealYear: string;
  dealMonth: string;
  dealDay: string;
  excluUseAr: string;
  floor: string;
  umdNm: string;
  jibun: string;
  roadNm: string;
}

interface MonthlyPriceSummaryItem {
  yearMonth: string;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  tradeCount: number;
}

interface AreaRange {
  min?: number;
  max?: number;
}

type ViewMode = "table" | "chart" | "trend";

interface RealPriceClientProps {
  initialMonthDefaults: RealPriceMonthDefaults;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function getTradeItems(data: unknown): Trade[] {
  const root = getRecord(data);
  if (!root) return [];

  const response = getRecord(root.response);
  const responseBody = getRecord(response?.body);
  const responseItems = getRecord(responseBody?.items);
  const body = getRecord(root.body);
  const bodyItems = getRecord(body?.items);

  const items = root.trades ?? responseItems?.item ?? bodyItems?.item ?? [];

  return Array.isArray(items) ? (items as Trade[]) : items ? [items as Trade] : [];
}

function getErrorMessage(data: unknown): string | null {
  const error = getRecord(data)?.error;
  return typeof error === "string" ? error : null;
}

function getMonthlyItems(data: unknown): MonthlyPriceSummaryItem[] {
  const monthly = getRecord(data)?.monthly;
  return Array.isArray(monthly) ? (monthly as MonthlyPriceSummaryItem[]) : [];
}

export default function RealPriceClient({
  initialMonthDefaults,
}: RealPriceClientProps) {
  const [regionCode, setRegionCode] = useState("11680");
  const {
    monthOptions,
    dealYmd,
    trendFromMonth,
    trendToMonth,
    setDealYmd,
    setTrendFromMonth,
    setTrendToMonth,
  } = useRealPriceMonthDefaults({ initialMonthDefaults });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [areaFilter, setAreaFilter] = useState<AreaRange>({});
  const [trendData, setTrendData] = useState<MonthlyPriceSummaryItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendSearched, setTrendSearched] = useState(false);

  const avgByDong = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of trades) {
      const amount = parseInt(t.dealAmount?.replace(/,/g, "").trim() || "0", 10);
      if (!amount || !t.umdNm) continue;
      const prev = map.get(t.umdNm) || { total: 0, count: 0 };
      map.set(t.umdNm, { total: prev.total + amount, count: prev.count + 1 });
    }
    return Array.from(map.entries())
      .map(([name, { total, count }]) => ({
        name,
        avg: Math.round(total / count),
        count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [trades]);

  const areaVsPrice = useMemo(() => {
    return trades
      .map((t) => ({
        area: parseFloat(t.excluUseAr) || 0,
        price: parseInt(t.dealAmount?.replace(/,/g, "").trim() || "0", 10),
        name: t.aptNm,
      }))
      .filter((d) => d.area > 0 && d.price > 0);
  }, [trades]);

  const handleSearch = useCallback(async () => {
    if (!dealYmd) {
      setError("계약월을 불러온 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        LAWD_CD: regionCode,
        DEAL_YMD: dealYmd,
        numOfRows: "50",
      });
      if (areaFilter.min !== undefined) {
        params.set("minArea", String(areaFilter.min));
      }
      if (areaFilter.max !== undefined) {
        params.set("maxArea", String(areaFilter.max));
      }
      const res = await fetch(`/api/real-price?${params.toString()}`);
      const data: unknown = await res.json();

      const errorMessage = getErrorMessage(data);
      if (errorMessage) {
        setError(errorMessage);
        setTrades([]);
        return;
      }

      setTrades(getTradeItems(data));
    } catch {
      setError("데이터를 불러오는 데 실패했습니다.");
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [areaFilter.max, areaFilter.min, dealYmd, regionCode]);

  const handleTrendSearch = useCallback(async () => {
    if (!trendFromMonth || !trendToMonth) {
      setTrendError("조회 기간을 불러온 후 다시 시도해주세요.");
      return;
    }

    if (trendFromMonth > trendToMonth) {
      setTrendError("시작월이 종료월보다 이후입니다.");
      return;
    }
    setTrendLoading(true);
    setTrendError(null);
    setTrendSearched(true);
    try {
      const res = await fetch(
        `/api/real-price/trend?regionCode=${regionCode}&fromMonth=${trendFromMonth}&toMonth=${trendToMonth}`,
      );
      const data: unknown = await res.json();

      const errorMessage = getErrorMessage(data);
      if (errorMessage) {
        setTrendError(errorMessage);
        setTrendData([]);
        return;
      }

      setTrendData(getMonthlyItems(data));
    } catch {
      setTrendError("추이 데이터를 불러오는 데 실패했습니다.");
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  }, [regionCode, trendFromMonth, trendToMonth]);

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-5xl" />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold">실거래가 조회</h1>
          <Link
            href="/real-price/compare"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            지역 간 비교 &rarr;
          </Link>
        </div>
        <p className="mb-2 text-muted-foreground">
          국토교통부 아파트 매매 실거래가 데이터를 조회합니다.
        </p>
        <p className="mb-8 text-xs text-muted-foreground">
          <span className="font-medium">참고용이며 법적 효력 없음</span>
          <span className="ml-1">
            * 본 정보는 참고용이며 법적 효력이 없습니다. 정확한 실거래 내역은
            국토교통부 실거래가 공개시스템을 확인해주세요.
          </span>
        </p>

        <div className="mb-4 flex gap-2">
          {(["table", "chart", "trend"] as const).map((mode) => {
            const labels: Record<ViewMode, string> = {
              table: "테이블",
              chart: "차트",
              trend: "월별 추이",
            };
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "border hover:bg-accent"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        <SupportedRegionNotice className="mb-4" />

        <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium">지역</label>
            <select
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {viewMode === "trend" ? (
            <>
              <div className="min-w-[160px]">
                <label className="mb-1 block text-sm font-medium">시작월</label>
                <select
                  value={trendFromMonth}
                  onChange={(e) => setTrendFromMonth(e.target.value)}
                  disabled={monthOptions.length === 0}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {monthOptions.length === 0 ? (
                    <option value="">불러오는 중...</option>
                  ) : (
                    monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1 block text-sm font-medium">종료월</label>
                <select
                  value={trendToMonth}
                  onChange={(e) => setTrendToMonth(e.target.value)}
                  disabled={monthOptions.length === 0}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {monthOptions.length === 0 ? (
                    <option value="">불러오는 중...</option>
                  ) : (
                    monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                onClick={handleTrendSearch}
                disabled={trendLoading || monthOptions.length === 0}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {trendLoading ? "조회 중..." : "추이 조회"}
              </button>
            </>
          ) : (
            <>
              <div className="min-w-[160px]">
                <label className="mb-1 block text-sm font-medium">계약월</label>
                <select
                  value={dealYmd}
                  onChange={(e) => setDealYmd(e.target.value)}
                  disabled={monthOptions.length === 0}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {monthOptions.length === 0 ? (
                    <option value="">불러오는 중...</option>
                  ) : (
                    monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || monthOptions.length === 0}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "조회 중..." : "조회"}
              </button>
            </>
          )}
        </div>

        {viewMode !== "trend" && (
          <div className="mb-8">
            <AreaFilter onFilterChange={setAreaFilter} />
          </div>
        )}

        {viewMode === "trend" && (
          <>
            {trendError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-medium text-red-800">{trendError}</p>
                <p className="mt-2 text-sm text-red-600">
                  data.go.kr API 키가 설정되어 있는지 확인해주세요.
                </p>
              </div>
            )}
            {!trendError && !trendSearched && !trendLoading && (
              <div className="rounded-lg border p-6 text-center text-muted-foreground">
                지역과 기간을 선택한 후 &quot;추이 조회&quot; 버튼을 눌러주세요.
              </div>
            )}
            {(trendSearched || trendLoading) && (
              <>
                <MonthlyPriceTrendChart data={trendData} loading={trendLoading} />
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  거래가 없는 월은 차트에서 빈 구간(gap)으로 표시됩니다. 본 정보는
                  참고용이며 법적 효력이 없습니다.
                </p>
              </>
            )}
          </>
        )}

        {viewMode !== "trend" && (
          <>
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

            {!loading && !error && searched && trades.length === 0 && (
              <div className="rounded-lg border p-10 text-center">
                <p className="text-lg font-medium">검색 결과가 없습니다</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  선택한 지역과 계약월에 등록된 거래 내역이 없습니다.
                </p>
                <ul className="mx-auto mt-4 max-w-md list-disc space-y-1 text-left text-sm text-muted-foreground">
                  <li>다른 계약월을 선택해보세요.</li>
                  <li>면적 필터를 적용 중이라면 범위를 넓혀보세요.</li>
                  <li>다른 지역을 선택해 다시 조회해보세요.</li>
                </ul>
              </div>
            )}

            {!loading && trades.length > 0 && (
              <>
                {viewMode === "chart" && (
                  <RealPriceCharts
                    avgByDong={avgByDong}
                    areaVsPrice={areaVsPrice}
                  />
                )}

                {viewMode === "table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-secondary/30 text-left">
                          <th className="px-3 py-3 font-medium">아파트</th>
                          <th className="px-3 py-3 font-medium">법정동</th>
                          <th className="px-3 py-3 font-medium text-right">거래금액</th>
                          <th className="px-3 py-3 font-medium text-right">전용면적</th>
                          <th className="px-3 py-3 font-medium text-right">층</th>
                          <th className="px-3 py-3 font-medium text-right">건축년도</th>
                          <th className="px-3 py-3 font-medium">거래일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((t, i) => (
                          <tr key={i} className="border-b hover:bg-secondary/10">
                            <td className="px-3 py-3 font-medium">{t.aptNm}</td>
                            <td className="px-3 py-3 text-muted-foreground">{t.umdNm}</td>
                            <td className="px-3 py-3 text-right font-medium text-primary">
                              {formatWonAmount(
                                parseInt(
                                  t.dealAmount?.replace(/,/g, "").trim() || "0",
                                  10,
                                ),
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">{t.excluUseAr}m²</td>
                            <td className="px-3 py-3 text-right">{t.floor}층</td>
                            <td className="px-3 py-3 text-right">{t.buildYear}</td>
                            <td className="px-3 py-3 text-muted-foreground">
                              {t.dealYear}.{t.dealMonth}.{t.dealDay}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-4 text-xs text-muted-foreground">
                      총 {trades.length}건 (최대 50건 표시)
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
