import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization header is required" },
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
      const body: unknown = await res.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            (body as Record<string, string>)?.message ??
            `Backend error: ${res.status}`,
        },
        { status: res.status },
      );
    }

    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
