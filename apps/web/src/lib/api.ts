const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 백엔드 표준 에러 envelope 의 web 쪽 로컬 미러.
 * (백엔드 패키지를 import 할 수 없어 형태만 복제.)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function createErrorBody(code: string, message: string): ApiResponse {
  return {
    success: false,
    error: { code, message },
  };
}

/**
 * 에러 응답 body 에서 메시지와 code 를 추출한다.
 * 1) 표준 envelope `error.message`/`error.code` 우선
 * 2) legacy fallback: `message`(string) → `error`(string, 프록시 라우트의 {error:string})
 * 3) 최종 fallback: `API 오류 (status)`
 */
export function parseErrorBody(
  body: unknown,
  status: number,
): { message: string; code?: string } {
  if (body !== null && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const envelopeError = record.error;

    if (
      envelopeError !== null &&
      typeof envelopeError === "object" &&
      "message" in envelopeError
    ) {
      const detail = envelopeError as { code?: unknown; message?: unknown };
      return {
        message: String(detail.message),
        code: typeof detail.code === "string" ? detail.code : undefined,
      };
    }

    if (typeof record.message === "string") {
      return { message: record.message };
    }

    if (typeof envelopeError === "string") {
      return { message: envelopeError };
    }
  }

  return { message: `API 오류 (${status})` };
}

interface FetchApiOptions extends Omit<RequestInit, "headers"> {
  /** 토큰이 없으면 ApiError(401)을 throw한다. */
  auth?: boolean;
  headers?: Record<string, string>;
  /**
   * 안전 타임아웃(ms). 초과 시 요청을 중단하고 ApiError(408)로 변환한다.
   * 미지정 시 60초. Render 콜드 스타트(30~35초)는 정상 완료되도록 충분히 길게.
   */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * 타임아웃용 내부 signal 과 (있으면) 외부 signal 을 합친다.
 * 둘 중 하나라도 abort 되면 결과 signal 도 abort 된다.
 */
function combineSignals(
  timeoutSignal: AbortSignal,
  externalSignal?: AbortSignal | null,
): AbortSignal {
  if (!externalSignal) {
    return timeoutSignal;
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([timeoutSignal, externalSignal]);
  }
  // fallback: 외부 signal abort 를 타임아웃 controller 로 전파.
  const controller = new AbortController();
  const forward = () => controller.abort();
  if (externalSignal.aborted || timeoutSignal.aborted) {
    controller.abort();
  } else {
    externalSignal.addEventListener("abort", forward, { once: true });
    timeoutSignal.addEventListener("abort", forward, { once: true });
  }
  return controller.signal;
}

export async function fetchApi<T>(
  path: string,
  options?: FetchApiOptions,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { auth, headers, timeoutMs, signal: externalSignal, ...rest } =
    options ?? {};

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("accessToken")
        : null;
    if (!token) {
      throw new ApiError("로그인이 필요합니다.", 401);
    }
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const timeoutController = new AbortController();
  const timer = setTimeout(
    () => timeoutController.abort(),
    timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const signal = combineSignals(timeoutController.signal, externalSignal);

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      signal,
    });
  } catch (err) {
    // 타임아웃/외부 abort 로 인한 중단을 일관된 ApiError 로 변환.
    if (err instanceof Error && err.name === "AbortError") {
      const reason = timeoutController.signal.aborted
        ? "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
        : "요청이 취소되었습니다.";
      throw new ApiError(reason, 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const { message, code } = parseErrorBody(body, res.status);
    throw new ApiError(message, res.status, code);
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

/**
 * 기존 branch 50 의 호출부를 위한 legacy 호환 헬퍼.
 * 내부적으로는 표준 envelope 파서와 같은 규칙을 사용한다.
 */
export function getBackendErrorMessage(
  body: unknown,
  status: number,
): string {
  return parseErrorBody(body, status).message;
}

/**
 * 백엔드 에러 응답을 표준 envelope 로 정규화한다 (프록시 라우트의 !res.ok 분기용).
 * body 파싱 실패 시 `HTTP_<status>` / `백엔드 오류 (status)` fallback.
 */
export async function backendErrorResponse(
  res: Response,
): Promise<{ status: number; body: ApiResponse }> {
  const raw = await res.json().catch(() => null);
  const { message, code } = parseErrorBody(raw, res.status);
  return {
    status: res.status,
    body: createErrorBody(
      code ?? `HTTP_${res.status}`,
      message || `백엔드 오류 (${res.status})`,
    ),
  };
}

/**
 * 프록시 라우트의 catch(네트워크 실패)용 표준 envelope.
 */
export function proxyErrorBody(message: string): ApiResponse {
  return {
    success: false,
    error: { code: "PROXY_ERROR", message },
  };
}
