import { NextResponse } from "next/server";
import { unwrapBackendData } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization header is required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
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
      const errBody: unknown = await res.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            (errBody as Record<string, string>)?.message ??
            `Backend error: ${res.status}`,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(unwrapBackendData(await res.json()));
  } catch {
    return NextResponse.json(
      { error: "Failed to update interest regions" },
      { status: 500 },
    );
  }
}
