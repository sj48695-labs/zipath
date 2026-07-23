"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SupportedRegionNotice from "../../_components/SupportedRegionNotice";
import { REGIONS, type Region } from "../../_lib/regions";
import { formatWonAmount } from "../../_lib/formatWonAmount";
import { type RealPriceMonthDefaults } from "../../_lib/monthOptions";
import { useRealPriceMonthDefaults } from "../../_lib/useRealPriceMonthDefaults";

const RegionCompareCharts = dynamic(
  () => import("./RegionCompareCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        차트를 불러오는 중입니다.
      </div>
    ),
  },
);

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

interface RegionCompareClientProps {
  initialMonthDefaults: RealPriceMonthDefaults;
}

function getTradeItems(data: unknown): Trade[] {
  if (typeof data !== "object" || data === null) {
    return [];
  }

  const record = data as Record<string, unknown>;
  const rootTrades = record.trades;
  if (Array.isArray(rootTrades)) {
    return rootTrades as Trade[];
  }
  if (rootTrades) {
    return [rootTrades as Trade];
  }

  const response = record.response;
  if (typeof response === "object" && response !== null) {
    const body = (response as Record<string, unknown>).body;
    if (typeof body === "object" && body !== null) {
      const items = (body as Record<string, unknown>).items;
      const responseItems = (items as Record<string, unknown> | undefined)?.item;
      if (Array.isArray(responseItems)) {
        return responseItems as Trade[];
      }
      if (responseItems) {
        return [responseItems as Trade];
      }
    }
  }

  const body = record.body;
  if (typeof body === "object" && body !== null) {
    const items = (body as Record<string, unknown>).items;
    const bodyItems = (items as Record<string, unknown> | undefined)?.item;
    if (Array.isArray(bodyItems)) {
      return bodyItems as Trade[];
    }
    if (bodyItems) {
      return [bodyItems as Trade];
    }
  }

  return [];
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

export default function RegionCompareClient({
  initialMonthDefaults,
}: RegionCompareClientProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const { monthOptions, dealYmd, setDealYmd } = useRealPriceMonthDefaults({
    initialMonthDefaults,
  });
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const trimmedQuery = searchQuery.trim();
  const filteredRegions = trimmedQuery
    ? REGIONS.filter((r) =>
        r.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : REGIONS;

  const handleToggleRegion = useCallback((code: string) => {
    setSelectedRegions((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= MAX_REGIONS) {
        return prev;
      }
      return [...prev, code];
    });
  }, []);

  const handleCompare = useCallback(async () => {
    if (selectedRegions.length < MIN_REGIONS) {
      setError(`최소 ${MIN_REGIONS}개 지역을 선택해주세요.`);
      return;
    }

    if (!dealYmd) {
      setError("계약월을 불러온 후 다시 시도해주세요.");
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

        return computeStats(getTradeItems(parsed), region);
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
  }, [dealYmd, selectedRegions]);

  const chartData: ChartDataItem[] = regionStats.map((s) => ({
    name: s.regionName,
    avgPrice: s.avgPrice,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    tradeCount: s.tradeCount,
  }));

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-5xl" />

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
        <p className="mb-8 text-xs text-muted-foreground">
          <span className="font-medium">참고용이며 법적 효력 없음</span>
          <span className="ml-1">
            * 본 정보는 참고용이며 법적 효력이 없습니다. 정확한 실거래 내역은
            국토교통부 실거래가 공개시스템을 확인해주세요.
          </span>
        </p>

        <div className="mb-6 rounded-lg border bg-card p-4">
          <SupportedRegionNotice variant="inline" className="mb-3" />
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

          <input
            type="text"
            placeholder="지역 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />

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

        <div className="mb-8 flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
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
            onClick={handleCompare}
            disabled={loading || selectedRegions.length < MIN_REGIONS || !dealYmd}
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

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

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

        {!loading && regionStats.length > 0 && (
          <div className="space-y-8">
            <RegionCompareCharts data={chartData} />

            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {regionStats.map((s) => (
                <div
                  key={s.regionCode}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="mb-2 flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          REGION_COLORS[selectedRegions.indexOf(s.regionCode)],
                      }}
                    />
                    <span className="truncate text-sm">{s.regionName}</span>
                  </div>
                  <dl className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">평균가</dt>
                      <dd className="font-medium text-primary">
                        {formatWonAmount(s.avgPrice)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">최저가</dt>
                      <dd className="text-green-600">
                        {formatWonAmount(s.minPrice)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">최고가</dt>
                      <dd className="text-red-600">
                        {formatWonAmount(s.maxPrice)}
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
                  {regionStats.map((s) => (
                    <tr
                      key={s.regionCode}
                      className="border-b hover:bg-secondary/10"
                    >
                      <td className="px-4 py-3 font-medium">
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              REGION_COLORS[
                                selectedRegions.indexOf(s.regionCode)
                              ],
                          }}
                        />
                        {s.regionName}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-primary">
                        {formatWonAmount(s.avgPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {formatWonAmount(s.minPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {formatWonAmount(s.maxPrice)}
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
