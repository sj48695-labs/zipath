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
  const regionCode = searchParams.get("regionCode");
  const fromMonth = searchParams.get("fromMonth");
  const toMonth = searchParams.get("toMonth");

  if (!regionCode || !fromMonth || !toMonth) {
    return NextResponse.json(
      createErrorBody(
        "VALIDATION_ERROR",
        "regionCode, fromMonth, and toMonth are required",
      ),
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${API_BASE}/real-price/trend?regionCode=${regionCode}&fromMonth=${fromMonth}&toMonth=${toMonth}`,
    );

    if (!res.ok) {
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("실거래가 추이를 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}
