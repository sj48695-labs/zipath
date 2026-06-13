import { fetchApi, ApiError, unwrapBackendData } from "../api";

describe("fetchApi", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
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
      .mockResolvedValue(
        jsonResponse({ message: "잘못된 요청" }, false, 400),
      );

    await expect(fetchApi("/bad")).rejects.toMatchObject({
      status: 400,
      message: "잘못된 요청",
    });
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
