import { NextResponse } from "next/server";

const API_BASE =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

export async function GET(request: Request) {
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lawdCd = searchParams.get("LAWD_CD");
  const dealYmd = searchParams.get("DEAL_YMD");
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "20";

  if (!lawdCd || !dealYmd) {
    return NextResponse.json(
      { error: "LAWD_CD and DEAL_YMD are required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    serviceKey,
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    pageNo,
    numOfRows,
    type: "json",
  });

  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch real price data" },
      { status: 500 }
    );
  }
}
