"use client";

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

interface ChartDataItem {
  name: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  tradeCount: number;
}

interface RegionCompareChartsProps {
  data: ChartDataItem[];
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

export default function RegionCompareCharts({ data }: RegionCompareChartsProps) {
  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">
          지역별 평균 거래가격 비교 (만원)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ bottom: 20 }}>
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

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">지역별 거래 건수</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
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
    </>
  );
}
