import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("pageNo") || "1";
  const limit = searchParams.get("numOfRows") || "10";
  const region = searchParams.get("region") || "";

  try {
    const params = new URLSearchParams({ page, limit });
    if (region) params.set("region", region);

    const res = await fetch(`${API_BASE}/announcements?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}
