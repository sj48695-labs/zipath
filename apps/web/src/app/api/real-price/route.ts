import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionCode = searchParams.get("LAWD_CD");
  const dealYmd = searchParams.get("DEAL_YMD");
  const minArea = searchParams.get("minArea");
  const maxArea = searchParams.get("maxArea");

  if (!regionCode || !dealYmd) {
    return NextResponse.json(
      { error: "LAWD_CD and DEAL_YMD are required" },
      { status: 400 },
    );
  }

  try {
    const params = new URLSearchParams({
      regionCode,
      yearMonth: dealYmd,
    });
    if (minArea) params.set("minArea", minArea);
    if (maxArea) params.set("maxArea", maxArea);

    const res = await fetch(
      `${API_BASE}/real-price/search?${params.toString()}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return NextResponse.json(
        { error: (body as Record<string, string>)?.message ?? `Backend error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch real price data" },
      { status: 500 },
    );
  }
}
