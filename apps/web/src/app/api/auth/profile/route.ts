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
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      createErrorBody("HTTP_401", "Authorization header is required"),
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!res.ok) {
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("프로필 정보를 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}
