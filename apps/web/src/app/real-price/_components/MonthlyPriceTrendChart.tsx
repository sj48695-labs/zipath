"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyPriceSummary {
  yearMonth: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  tradeCount: number;
}

interface MonthlyPriceTrendChartProps {
  data: MonthlyPriceSummary[];
  loading: boolean;
}

type ChartMode = "avg" | "range";

function formatYearMonth(ym: string): string {
  const year = ym.slice(0, 4);
  const month = ym.slice(4, 6);
  return `${year}.${month}`;
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

import { useState } from "react";

export default function MonthlyPriceTrendChart({
  data,
  loading,
}: MonthlyPriceTrendChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("avg");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        조회된 추이 데이터가 없습니다. 지역과 기간을 선택 후 조회해주세요.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatYearMonth(d.yearMonth),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">월별 가격 추이</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartMode("avg")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              chartMode === "avg"
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent"
            }`}
          >
            평균가
          </button>
          <button
            onClick={() => setChartMode("range")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              chartMode === "range"
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent"
            }`}
          >
            가격 범위
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <ResponsiveContainer width="100%" height={350}>
          {chartMode === "avg" ? (
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
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
                  if (n === "tradeCount") return [`${v}건`, "거래 건수"];
                  return [formatPrice(v), n];
                }}
                labelFormatter={(label: unknown) => String(label)}
              />
              <Legend
                formatter={(value: unknown) => {
                  const v = String(value);
                  if (v === "avgPrice") return "평균가";
                  if (v === "tradeCount") return "거래 건수";
                  return v;
                }}
              />
              <Line
                type="monotone"
                dataKey="avgPrice"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
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
                  if (n === "maxPrice") return [formatPrice(v), "최고가"];
                  if (n === "avgPrice") return [formatPrice(v), "평균가"];
                  if (n === "minPrice") return [formatPrice(v), "최저가"];
                  return [formatPrice(v), n];
                }}
                labelFormatter={(label: unknown) => String(label)}
              />
              <Legend
                formatter={(value: unknown) => {
                  const v = String(value);
                  if (v === "maxPrice") return "최고가";
                  if (v === "avgPrice") return "평균가";
                  if (v === "minPrice") return "최저가";
                  return v;
                }}
              />
              <Area
                type="monotone"
                dataKey="maxPrice"
                stroke="hsl(0, 72%, 51%)"
                fill="hsl(0, 72%, 51%)"
                fillOpacity={0.1}
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="avgPrice"
                stroke="hsl(221, 83%, 53%)"
                fill="hsl(221, 83%, 53%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="minPrice"
                stroke="hsl(142, 71%, 45%)"
                fill="hsl(142, 71%, 45%)"
                fillOpacity={0.1}
                strokeWidth={1}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary table below chart */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/30 text-left">
              <th className="px-3 py-2 font-medium">월</th>
              <th className="px-3 py-2 text-right font-medium">평균가</th>
              <th className="px-3 py-2 text-right font-medium">최저가</th>
              <th className="px-3 py-2 text-right font-medium">최고가</th>
              <th className="px-3 py-2 text-right font-medium">거래 건수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.yearMonth} className="border-b hover:bg-secondary/10">
                <td className="px-3 py-2">{formatYearMonth(d.yearMonth)}</td>
                <td className="px-3 py-2 text-right font-medium text-primary">
                  {formatPrice(d.avgPrice)}
                </td>
                <td className="px-3 py-2 text-right text-green-600">
                  {formatPrice(d.minPrice)}
                </td>
                <td className="px-3 py-2 text-right text-red-600">
                  {formatPrice(d.maxPrice)}
                </td>
                <td className="px-3 py-2 text-right">{d.tradeCount}건</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
