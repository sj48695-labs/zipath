"use client";

import Link from "next/link";
import { useState } from "react";

const REGIONS = [
  { code: "11110", name: "서울 종로구" },
  { code: "11140", name: "서울 중구" },
  { code: "11170", name: "서울 용산구" },
  { code: "11200", name: "서울 성동구" },
  { code: "11215", name: "서울 광진구" },
  { code: "11230", name: "서울 동대문구" },
  { code: "11260", name: "서울 중랑구" },
  { code: "11290", name: "서울 성북구" },
  { code: "11305", name: "서울 강북구" },
  { code: "11320", name: "서울 도봉구" },
  { code: "11350", name: "서울 노원구" },
  { code: "11380", name: "서울 은평구" },
  { code: "11410", name: "서울 서대문구" },
  { code: "11440", name: "서울 마포구" },
  { code: "11470", name: "서울 양천구" },
  { code: "11500", name: "서울 강서구" },
  { code: "11530", name: "서울 구로구" },
  { code: "11545", name: "서울 금천구" },
  { code: "11560", name: "서울 영등포구" },
  { code: "11590", name: "서울 동작구" },
  { code: "11620", name: "서울 관악구" },
  { code: "11650", name: "서울 서초구" },
  { code: "11680", name: "서울 강남구" },
  { code: "11710", name: "서울 송파구" },
  { code: "11740", name: "서울 강동구" },
  { code: "41111", name: "경기 수원시 장안구" },
  { code: "41113", name: "경기 수원시 권선구" },
  { code: "41115", name: "경기 수원시 팔달구" },
  { code: "41117", name: "경기 수원시 영통구" },
  { code: "41131", name: "경기 성남시 수정구" },
  { code: "41133", name: "경기 성남시 중원구" },
  { code: "41135", name: "경기 성남시 분당구" },
  { code: "41281", name: "경기 고양시 덕양구" },
  { code: "41285", name: "경기 고양시 일산동구" },
  { code: "41287", name: "경기 고양시 일산서구" },
  { code: "41390", name: "경기 화성시" },
  { code: "41410", name: "경기 파주시" },
  { code: "41461", name: "경기 용인시 처인구" },
  { code: "41463", name: "경기 용인시 기흥구" },
  { code: "41465", name: "경기 용인시 수지구" },
  { code: "41480", name: "경기 김포시" },
  { code: "28110", name: "인천 중구" },
  { code: "28140", name: "인천 동구" },
  { code: "28177", name: "인천 미추홀구" },
  { code: "28185", name: "인천 연수구" },
  { code: "28200", name: "인천 남동구" },
  { code: "28237", name: "인천 부평구" },
  { code: "28245", name: "인천 계양구" },
  { code: "28260", name: "인천 서구" },
  { code: "26110", name: "부산 중구" },
  { code: "26140", name: "부산 서구" },
  { code: "26170", name: "부산 동구" },
  { code: "26200", name: "부산 영도구" },
  { code: "26230", name: "부산 부산진구" },
  { code: "26260", name: "부산 동래구" },
  { code: "26290", name: "부산 남구" },
  { code: "26320", name: "부산 북구" },
  { code: "26350", name: "부산 해운대구" },
  { code: "26380", name: "부산 사하구" },
  { code: "26410", name: "부산 금정구" },
  { code: "26440", name: "부산 강서구" },
  { code: "26470", name: "부산 연제구" },
  { code: "26500", name: "부산 수영구" },
  { code: "26530", name: "부산 사상구" },
  { code: "26710", name: "부산 기장군" },
];

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

export default function RealPricePage() {
  const [regionCode, setRegionCode] = useState("11680");
  const [dealYmd, setDealYmd] = useState(() => getMonthOptions()[0].value);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const monthOptions = getMonthOptions();

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/real-price?LAWD_CD=${regionCode}&DEAL_YMD=${dealYmd}&numOfRows=50`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setTrades([]);
        return;
      }

      // 백엔드 RealPriceResponse 포맷 지원 + 기존 공공API 포맷 fallback
      const items =
        data?.trades ??
        data?.response?.body?.items?.item ??
        data?.body?.items?.item ??
        [];
      setTrades(Array.isArray(items) ? items : items ? [items] : []);
    } catch {
      setError("데이터를 불러오는 데 실패했습니다.");
      setTrades([]);
    } finally {
      setLoading(false);
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
            <Link href="/subscription" className="hover:text-foreground">청약</Link>
            <Link href="/loan" className="hover:text-foreground">대출</Link>
            <Link href="/checklist" className="hover:text-foreground">체크리스트</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">실거래가 조회</h1>
        <p className="mb-8 text-muted-foreground">
          국토교통부 아파트 매매 실거래가 데이터를 조회합니다.
        </p>

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
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>

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
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            해당 조건의 거래 데이터가 없습니다.
          </div>
        )}

        {!loading && trades.length > 0 && (
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
                      {t.dealAmount?.trim()}만원
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
      </main>
    </div>
  );
}
