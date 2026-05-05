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

  return res.json() as Promise<T>;
}
