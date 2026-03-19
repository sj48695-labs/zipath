import { NextResponse } from "next/server";

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
        return NextResponse.json(
          { error: `Backend error: ${res.status}` },
          { status: res.status },
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // Default: analyze
    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({ address });
    const res = await fetch(
      `${API_BASE}/registry/analyze?${params.toString()}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return NextResponse.json(
        { error: (body as Record<string, string>)?.message ?? `Backend error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch registry data" },
      { status: 500 },
    );
  }
}
