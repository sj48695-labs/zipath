import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type) {
    return NextResponse.json(
      { error: "type 파라미터가 필요합니다 (월세, 전세, 매매)" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_BASE}/contract-analysis/checklist?type=${encodeURIComponent(type)}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return NextResponse.json(
        { error: (body as Record<string, string>)?.message ?? `Backend error: ${res.status}` },
        { status: res.status },
      );
    }

    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "계약서 분석 데이터를 불러올 수 없습니다." },
      { status: 500 },
    );
  }
}
