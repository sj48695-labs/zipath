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
  const type = searchParams.get("type");

  if (!type) {
    return NextResponse.json(
      createErrorBody(
        "VALIDATION_ERROR",
        "type 파라미터가 필요합니다 (월세, 전세, 매매)",
      ),
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_BASE}/contract-analysis/checklist?type=${encodeURIComponent(type)}`,
    );

    if (!res.ok) {
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("계약서 분석 데이터를 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}
