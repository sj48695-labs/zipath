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
  const userId = searchParams.get("userId");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";

  if (!userId) {
    return NextResponse.json(
      createErrorBody("VALIDATION_ERROR", "userId is required"),
      { status: 400 },
    );
  }

  try {
    const params = new URLSearchParams({ page, limit });
    const res = await fetch(
      `${API_BASE}/notifications/${userId}?${params.toString()}`,
    );

    if (!res.ok) {
      const { status, body } = await backendErrorResponse(res);
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("알림 목록을 불러올 수 없습니다."),
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createErrorBody("VALIDATION_ERROR", "요청 본문이 올바른 JSON 형식이 아닙니다."),
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const { status, body: errorBody } = await backendErrorResponse(res);
      return NextResponse.json(errorBody, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("알림 설정을 저장할 수 없습니다."),
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const prefId = searchParams.get("prefId");

  if (!prefId) {
    return NextResponse.json(
      createErrorBody("VALIDATION_ERROR", "prefId is required"),
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    const res = await fetch(`${API_BASE}/notifications/preferences/${prefId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const { status, body: errorBody } = await backendErrorResponse(res);
      return NextResponse.json(errorBody, { status });
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      proxyErrorBody("알림 설정을 수정할 수 없습니다."),
      { status: 500 },
    );
  }
}
