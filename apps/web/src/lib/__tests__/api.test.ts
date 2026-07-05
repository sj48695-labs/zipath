import {
  ApiError,
  backendErrorResponse,
  createErrorBody,
  fetchApi,
  getBackendErrorMessage,
  proxyErrorBody,
  unwrapBackendData,
} from "../api";

describe("fetchApi", () => {
  const originalFetch = global.fetch;
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
    jest.useRealTimers();
  });

  function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
      ok,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it("정상 응답 시 백엔드 래핑을 풀어서 반환한다", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: { value: 42 } }));

    const result = await fetchApi<{ value: number }>("/test");

    expect(result).toEqual({ value: 42 });
  });

  it("auth 옵션인데 토큰이 없으면 401 ApiError 를 throw 한다", async () => {
    Reflect.deleteProperty(globalThis, "window");

    await expect(fetchApi("/secure", { auth: true })).rejects.toMatchObject({
      status: 401,
      message: "로그인이 필요합니다.",
    });
  });

  it("auth 옵션이면 accessToken을 Authorization 헤더로 전송한다", async () => {
    const localStorage = {
      getItem: jest.fn().mockReturnValue("token-123"),
    };

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage },
    });

    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: { value: 7 } }));

    const result = await fetchApi<{ value: number }>("/secure", { auth: true });

    expect(localStorage.getItem).toHaveBeenCalledWith("accessToken");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/secure"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
    expect(result).toEqual({ value: 7 });
  });

  it("timeoutMs 초과 시 408 ApiError 를 throw 한다", async () => {
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            reject(
              Object.assign(new Error("aborted"), { name: "AbortError" }),
            );
          });
        }
      });
    }) as unknown as typeof fetch;

    await expect(
      fetchApi("/slow", { timeoutMs: 20 }),
    ).rejects.toMatchObject({ status: 408, kind: "timeout" });
  });

  it("fetch 자체 실패는 network ApiError 로 정규화한다", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("failed to fetch"));

    await expect(fetchApi("/offline")).rejects.toMatchObject({
      status: 0,
      kind: "network",
    });
  });

  it("외부 signal abort 를 전파하여 요청을 중단한다", async () => {
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            reject(
              Object.assign(new Error("aborted"), { name: "AbortError" }),
            );
          });
        }
      });
    }) as unknown as typeof fetch;

    const controller = new AbortController();
    const promise = fetchApi("/slow", {
      timeoutMs: 60_000,
      signal: controller.signal,
    });
    controller.abort();

    await expect(promise).rejects.toMatchObject({
      status: 0,
      kind: "network",
    });
  });

  it("응답이 ok 가 아니면 ApiError 로 변환한다", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ message: "잘못된 요청" }, false, 400),
      );

    await expect(fetchApi("/bad")).rejects.toMatchObject({
      status: 400,
      message: "잘못된 요청",
      kind: "http",
    });
  });

  it("표준 envelope 에러는 message 와 code 를 전달한다", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "잘못된 요청" },
        },
        false,
        400,
      ),
    );

    await expect(fetchApi("/bad")).rejects.toMatchObject({
      status: 400,
      message: "잘못된 요청",
      code: "VALIDATION_ERROR",
    });
  });

  it("에러 정보 없는 비표준 body 는 fallback 메시지를 쓴다", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({}, false, 500));

    await expect(fetchApi("/bad")).rejects.toMatchObject({
      status: 500,
      message: "API 오류 (500)",
    });
  });
});

describe("getBackendErrorMessage", () => {
  it("backend error.message 를 우선 사용한다", () => {
    expect(
      getBackendErrorMessage({ error: { message: "서버 오류" } }, 500),
    ).toBe("서버 오류");
  });

  it("message 필드가 있으면 fallback 으로 사용한다", () => {
    expect(getBackendErrorMessage({ message: "직접 오류" }, 400)).toBe(
      "직접 오류",
    );
  });

  it("둘 다 없으면 상태 코드 메시지를 사용한다", () => {
    expect(getBackendErrorMessage({}, 403)).toBe("API 오류 (403)");
  });
});

describe("unwrapBackendData", () => {
  it("success/data 래핑을 푼다", () => {
    expect(unwrapBackendData({ success: true, data: { a: 1 } })).toEqual({
      a: 1,
    });
  });

  it("래핑되지 않은 값은 그대로 반환한다", () => {
    expect(unwrapBackendData({ a: 1 })).toEqual({ a: 1 });
  });
});

describe("error helpers", () => {
  it("createErrorBody 는 표준 에러 envelope 를 만든다", () => {
    expect(createErrorBody("VALIDATION_ERROR", "잘못된 요청")).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "잘못된 요청" },
    });
  });

  it("proxyErrorBody 는 PROXY_ERROR envelope 를 만든다", () => {
    expect(proxyErrorBody("백엔드 호출 실패")).toEqual({
      success: false,
      error: { code: "PROXY_ERROR", message: "백엔드 호출 실패" },
    });
  });

  it("backendErrorResponse 는 표준 error envelope 를 유지한다", async () => {
    const res = {
      status: 502,
      json: async () => ({
        success: false,
        error: { code: "HTTP_502", message: "업스트림 오류" },
      }),
    } as Response;

    await expect(backendErrorResponse(res)).resolves.toEqual({
      status: 502,
      body: {
        success: false,
        error: { code: "HTTP_502", message: "업스트림 오류" },
      },
    });
  });
});
