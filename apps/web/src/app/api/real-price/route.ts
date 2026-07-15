import { NextResponse } from "next/server";
import {
  backendErrorResponse,
  createErrorBody,
  proxyErrorBody,
  unwrapBackendData,
} from "@/lib/api";

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
      createErrorBody(
        "VALIDATION_ERROR",
        "LAWD_CD and DEAL_YMD are required",
      ),
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
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("실거래가 데이터를 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}
