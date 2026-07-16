"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { formatWonAmount } from "../_lib/formatWonAmount";

interface DongAverage {
  name: string;
  avg: number;
  count: number;
}

interface AreaPricePoint {
  area: number;
  price: number;
  name: string;
}

interface RealPriceChartsProps {
  avgByDong: DongAverage[];
  areaVsPrice: AreaPricePoint[];
}

export default function RealPriceCharts({
  avgByDong,
  areaVsPrice,
}: RealPriceChartsProps) {
  return (
    <div className="space-y-8">
      {avgByDong.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">
            법정동별 평균 거래가격 (만원)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgByDong} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v / 10000).toFixed(1)}억`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: unknown) => [formatWonAmount(Number(value)), "평균가"]}
                labelFormatter={(label: unknown) => String(label)}
              />
              <Bar
                dataKey="avg"
                fill="hsl(221, 83%, 53%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {areaVsPrice.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">전용면적별 거래가격 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="area"
                name="면적"
                unit="m²"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="price"
                name="가격"
                tickFormatter={(v: number) => `${(v / 10000).toFixed(1)}억`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: unknown, name: unknown) => {
                  const v = Number(value);
                  const n = String(name);
                  if (n === "가격") return [formatWonAmount(v), n];
                  return [`${v}m²`, n];
                }}
              />
              <Scatter
                data={areaVsPrice}
                fill="hsl(221, 83%, 53%)"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
