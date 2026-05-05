const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchApiOptions extends Omit<RequestInit, "headers"> {
  /** 토큰이 없으면 ApiError(401)을 throw한다. */
  auth?: boolean;
  headers?: Record<string, string>;
}

export async function fetchApi<T>(
  path: string,
  options?: FetchApiOptions,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { auth, headers, ...rest } = options ?? {};

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (!token) {
      throw new ApiError("로그인이 필요합니다.", 401);
    }
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body as Record<string, unknown>)?.message ?? `API 오류 (${res.status})`;
    throw new ApiError(String(message), res.status);
  }

  // 백엔드 TransformInterceptor 가 응답을 {success, data} 로 래핑함.
  // 페이지 코드는 unwrapped 형태를 기대하므로 여기서 풀어서 반환.
  return unwrapBackendData<T>(await res.json());
}

/**
 * NestJS TransformInterceptor 의 {success, data} 래핑을 풀어 안쪽 data 를 반환.
 * 래핑되지 않은 응답은 그대로 통과 (안전 fallback).
 *
 * Vercel Next.js API 라우트가 백엔드를 프록시할 때, 응답을 그대로 클라이언트
 * 페이지에 흘려보내면 페이지 코드가 unwrapped 형태를 기대하므로 깨진다.
 * 라우트들이 이 헬퍼로 unwrap 후 NextResponse.json 으로 반환해야 함.
 */
export function unwrapBackendData<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === "object" &&
    "success" in body &&
    "data" in body
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}
