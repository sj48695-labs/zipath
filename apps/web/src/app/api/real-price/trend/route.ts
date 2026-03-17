import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionCode = searchParams.get("regionCode");
  const fromMonth = searchParams.get("fromMonth");
  const toMonth = searchParams.get("toMonth");

  if (!regionCode || !fromMonth || !toMonth) {
    return NextResponse.json(
      { error: "regionCode, fromMonth, and toMonth are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_BASE}/real-price/trend?regionCode=${regionCode}&fromMonth=${fromMonth}&toMonth=${toMonth}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            (body as Record<string, string>)?.message ??
            `Backend error: ${res.status}`,
        },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch trend data" },
      { status: 500 },
    );
  }
}
