import { NextResponse } from "next/server";
import {
  backendErrorResponse,
  proxyErrorBody,
  unwrapBackendData,
} from "@/lib/api";

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
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("공고 목록을 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}
