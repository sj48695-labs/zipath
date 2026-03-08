import { NextResponse } from "next/server";

const API_BASE = "https://apis.data.go.kr/B552555/lttotPblancList";

export async function GET(request: Request) {
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pageNo = searchParams.get("pageNo") || "1";
  const numOfRows = searchParams.get("numOfRows") || "10";

  const params = new URLSearchParams({
    serviceKey,
    pageNo,
    numOfRows,
    type: "json",
  });

  try {
    const res = await fetch(
      `${API_BASE}/getAPTLttotPblancList?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
