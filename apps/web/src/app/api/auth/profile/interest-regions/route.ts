import { NextResponse } from "next/server";
import {
  backendErrorResponse,
  createErrorBody,
  proxyErrorBody,
  unwrapBackendData,
} from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      createErrorBody("HTTP_401", "Authorization header is required"),
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createErrorBody("VALIDATION_ERROR", "Invalid JSON body"),
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/auth/profile/interest-regions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("관심 지역을 수정할 수 없습니다."),
      { status: 500 },
    );
  }
}
