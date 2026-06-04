"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import SupportedRegionNotice from "../_components/SupportedRegionNotice";
import {
  REGIONS,
  isUnsupportedRegionQuery,
  type Region,
} from "../_lib/regions";

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

interface RegionStats {
  regionCode: string;
  regionName: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  tradeCount: number;
}

interface ChartDataItem {
  name: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  tradeCount: number;
}

const MAX_REGIONS = 4;
const MIN_REGIONS = 2;

const REGION_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(0, 72%, 51%)",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
];

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    options.push({ value, label });
  }
  return options;
}

function formatPrice(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = value % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString()}`;
  }
  return `${value.toLocaleString()}만원`;
}

function computeStats(trades: Trade[], region: Region): RegionStats {
  const prices = trades
    .map((t) => parseInt(t.dealAmount?.replace(/,/g, "").trim() || "0", 10))
    .filter((p) => p > 0);

  if (prices.length === 0) {
    return {
      regionCode: region.code,
      regionName: region.name,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      tradeCount: 0,
    };
  }

  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    regionCode: region.code,
    regionName: region.name,
    avgPrice: Math.round(sum / prices.length),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    tradeCount: prices.length,
  };
}

export default function RegionComparePage() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [dealYmd, setDealYmd] = useState(() => getMonthOptions()[0].value);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const monthOptions = getMonthOptions();

  const trimmedQuery = searchQuery.trim();
  const filteredRegions = trimmedQuery
    ? REGIONS.filter((r) =>
        r.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : REGIONS;

  const showUnsupportedNotice = isUnsupportedRegionQuery(
    trimmedQuery,
    filteredRegions.length,
  );

  const handleToggleRegion = useCallback(
    (code: string) => {
      setSelectedRegions((prev) => {
        if (prev.includes(code)) {
          return prev.filter((c) => c !== code);
        }
        if (prev.length >= MAX_REGIONS) {
          return prev;
        }
        return [...prev, code];
      });
    },
    [],
  );

  const handleCompare = useCallback(async () => {
    if (selectedRegions.length < MIN_REGIONS) {
      setError(`최소 ${MIN_REGIONS}개 지역을 선택해주세요.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const results: RegionStats[] = [];

      const fetchPromises = selectedRegions.map(async (code) => {
        const region = REGIONS.find((r) => r.code === code);
        if (!region) return null;

        const res = await fetch(
          `/api/real-price?LAWD_CD=${code}&DEAL_YMD=${dealYmd}&numOfRows=50`,
        );
        const data: unknown = await res.json();

        const parsed = data as Record<string, unknown>;
        if (parsed.error) {
          return null;
        }

        const items =
          (parsed.trades as Trade[] | undefined) ??
          ((
            (parsed.response as Record<string, unknown>)?.body as Record<
              string,
              unknown
            >
          )?.items as Record<string, unknown>)?.item ??
          ((parsed.body as Record<string, unknown>)?.items as Record<
            string,
            unknown
          >)?.item ??
          [];

        const trades: Trade[] = Array.isArray(items)
          ? (items as Trade[])
          : items
            ? [items as Trade]
            : [];

        return computeStats(trades, region);
      });

      const settled = await Promise.all(fetchPromises);
      for (const stat of settled) {
        if (stat) {
          results.push(stat);
        }
      }

      if (results.length === 0) {
        setError("선택한 지역의 거래 데이터를 불러오지 못했습니다.");
        setRegionStats([]);
      } else {
        setRegionStats(results);
      }
    } catch {
      setError("데이터를 불러오는 데 실패했습니다.");
      setRegionStats([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRegions, dealYmd]);

  const chartData: ChartDataItem[] = regionStats.map((s) => ({
    name: s.regionName,
    avgPrice: s.avgPrice,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    tradeCount: s.tradeCount,
  }));

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
            <Link href="/real-price" className="hover:text-foreground">
              실거래가
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
        <div className="mb-2 flex items-center gap-3">
          <Link
            href="/real-price"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; 실거래가 조회
          </Link>
        </div>
        <h1 className="mb-2 text-3xl font-bold">지역 간 비교</h1>
        <p className="mb-8 text-muted-foreground">
          2~4개 지역의 아파트 실거래가를 비교합니다.
        </p>

        {/* Region selection */}
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium">
              지역 선택 ({selectedRegions.length}/{MAX_REGIONS})
            </label>
            {selectedRegions.length > 0 && (
              <button
                onClick={() => setSelectedRegions([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                전체 해제
              </button>
            )}
          </div>

          {/* Selected regions chips */}
          {selectedRegions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedRegions.map((code, idx) => {
                const region = REGIONS.find((r) => r.code === code);
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: REGION_COLORS[idx] }}
                  >
                    {region?.name}
                    <button
                      onClick={() => handleToggleRegion(code)}
                      className="ml-1 hover:opacity-70"
                      aria-label={`${region?.name} 선택 해제`}
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search filter */}
          <input
            type="text"
            placeholder="지역 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />

          {showUnsupportedNotice && (
            <SupportedRegionNotice variant="inline" className="mb-3" />
          )}

          <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {filteredRegions.map((r) => {
              const isSelected = selectedRegions.includes(r.code);
              const isDisabled =
                !isSelected && selectedRegions.length >= MAX_REGIONS;
              return (
                <label
                  key={r.code}
                  className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 font-medium text-primary"
                      : isDisabled
                        ? "cursor-not-allowed text-muted-foreground/50"
                        : "hover:bg-accent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleToggleRegion(r.code)}
                    className="accent-primary"
                  />
                  {r.name}
                </label>
              );
            })}
          </div>
        </div>

        {/* Month selector and search */}
        <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium">계약월</label>
            <select
              value={dealYmd}
              onChange={(e) => setDealYmd(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || selectedRegions.length < MIN_REGIONS}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "비교 중..." : "비교 조회"}
          </button>
          {selectedRegions.length < MIN_REGIONS && (
            <p className="text-xs text-muted-foreground">
              최소 {MIN_REGIONS}개 지역을 선택해주세요.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !searched && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            비교할 지역을 선택한 후 &quot;비교 조회&quot; 버튼을 눌러주세요.
          </div>
        )}

        {!loading && searched && !error && regionStats.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            해당 조건의 거래 데이터가 없습니다.
          </div>
        )}

        {/* Results */}
        {!loading && regionStats.length > 0 && (
          <div className="space-y-8">
            {/* Bar chart - average price comparison */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold">
                지역별 평균 거래가격 비교 (만원)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(v: number) => {
                      if (v >= 10000) return `${(v / 10000).toFixed(1)}억`;
                      return `${v.toLocaleString()}`;
                    }}
                    tick={{ fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      const v = Number(value);
                      const n = String(name);
                      if (n === "avgPrice") return [formatPrice(v), "평균가"];
                      if (n === "minPrice") return [formatPrice(v), "최저가"];
                      if (n === "maxPrice") return [formatPrice(v), "최고가"];
                      return [formatPrice(v), n];
                    }}
                    labelFormatter={(label: unknown) => String(label)}
                  />
                  <Legend
                    formatter={(value: unknown) => {
                      const v = String(value);
                      if (v === "avgPrice") return "평균가";
                      if (v === "minPrice") return "최저가";
                      if (v === "maxPrice") return "최고가";
                      return v;
                    }}
                  />
                  <Bar
                    dataKey="avgPrice"
                    fill="hsl(221, 83%, 53%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="minPrice"
                    fill="hsl(142, 71%, 45%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="maxPrice"
                    fill="hsl(0, 72%, 51%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trade count bar chart */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold">지역별 거래 건수</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: unknown) => [
                      `${Number(value)}건`,
                      "거래 건수",
                    ]}
                    labelFormatter={(label: unknown) => String(label)}
                  />
                  <Bar
                    dataKey="tradeCount"
                    fill="hsl(221, 83%, 53%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile: card grid (no horizontal scroll) */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {regionStats.map((s, idx) => (
                <div
                  key={s.regionCode}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="mb-2 flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: REGION_COLORS[idx] }}
                    />
                    <span className="truncate text-sm">{s.regionName}</span>
                  </div>
                  <dl className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">평균가</dt>
                      <dd className="font-medium text-primary">
                        {s.avgPrice > 0 ? formatPrice(s.avgPrice) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">최저가</dt>
                      <dd className="text-green-600">
                        {s.minPrice > 0 ? formatPrice(s.minPrice) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">최고가</dt>
                      <dd className="text-red-600">
                        {s.maxPrice > 0 ? formatPrice(s.maxPrice) : "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">거래</dt>
                      <dd>{s.tradeCount}건</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            {/* Desktop: data table */}
            <div className="hidden overflow-x-auto rounded-lg border sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30 text-left">
                    <th className="px-4 py-3 font-medium">지역</th>
                    <th className="px-4 py-3 text-right font-medium">
                      평균가
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      최저가
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      최고가
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      거래 건수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {regionStats.map((s, idx) => (
                    <tr
                      key={s.regionCode}
                      className="border-b hover:bg-secondary/10"
                    >
                      <td className="px-4 py-3 font-medium">
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: REGION_COLORS[idx],
                          }}
                        />
                        {s.regionName}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-primary">
                        {s.avgPrice > 0 ? formatPrice(s.avgPrice) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {s.minPrice > 0 ? formatPrice(s.minPrice) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {s.maxPrice > 0 ? formatPrice(s.maxPrice) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.tradeCount}건
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              * 각 지역 최대 50건 기준 통계이며, 참고용 데이터입니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
