import {
  ApiError,
  fetchApi,
  getBackendErrorMessage,
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
    ).rejects.toMatchObject({ status: 408 });
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

    await expect(promise).rejects.toBeInstanceOf(ApiError);
  });

  it("응답이 ok 가 아니면 ApiError 로 변환한다", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: { message: "잘못된 요청" } }, false, 400));

    await expect(fetchApi("/bad")).rejects.toMatchObject({
      status: 400,
      message: "잘못된 요청",
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
