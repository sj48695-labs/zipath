import { GET } from "./route";

describe("/api/auth/profile route", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
      ok,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it("Authorization 헤더를 백엔드로 전달하고 응답을 unwrap 한다", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({
          success: true,
          data: {
            id: 1,
            email: "test@example.com",
            nickname: "테스터",
            provider: "google",
            interestRegions: ["서울 강남구"],
            createdAt: "2026-01-01T00:00:00.000Z",
            lastActiveAt: "2026-01-02T00:00:00.000Z",
          },
        }),
      );

    const response = await GET(
      new Request("http://localhost/api/auth/profile", {
        headers: {
          Authorization: "Bearer token-123",
        },
      }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/profile"),
      expect.objectContaining({
        headers: {
          Authorization: "Bearer token-123",
        },
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: 1,
      email: "test@example.com",
      nickname: "테스터",
      provider: "google",
      interestRegions: ["서울 강남구"],
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("Authorization 헤더가 없으면 401을 반환한다", async () => {
    const response = await GET(
      new Request("http://localhost/api/auth/profile"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "HTTP_401",
        message: "Authorization header is required",
      },
    });
  });

  it("백엔드 에러의 error.message 를 프록시한다", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "HTTP_401",
            message: "토큰이 만료되었습니다.",
          },
        },
        false,
        401,
      ),
    );

    const response = await GET(
      new Request("http://localhost/api/auth/profile", {
        headers: {
          Authorization: "Bearer expired-token",
        },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "HTTP_401",
        message: "토큰이 만료되었습니다.",
      },
    });
  });
});
