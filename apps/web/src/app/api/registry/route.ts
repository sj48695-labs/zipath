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
  const address = searchParams.get("address");
  const type = searchParams.get("type"); // "analyze" or "terms"

  try {
    if (type === "terms") {
      const res = await fetch(`${API_BASE}/registry/terms`);

      if (!res.ok) {
        const { status, body } = await backendErrorResponse(res);
        return NextResponse.json(body, { status });
      }

      return NextResponse.json(unwrapBackendData(await res.json()));
    }

    // Default: analyze
    if (!address) {
      return NextResponse.json(
        createErrorBody("VALIDATION_ERROR", "address is required"),
        { status: 400 },
      );
    }

    const params = new URLSearchParams({ address });
    const res = await fetch(
      `${API_BASE}/registry/analyze?${params.toString()}`,
    );

    if (!res.ok) {
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("등기부 분석 데이터를 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}
