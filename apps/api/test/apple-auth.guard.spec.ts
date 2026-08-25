import { ConfigService } from "@nestjs/config";
import { ExecutionContext } from "@nestjs/common";
import { AppleAuthGuard } from "../src/auth/apple-auth.guard";

describe("AppleAuthGuard", () => {
  it("시작 요청에서 만든 state와 nonce를 Apple 인가 요청에 전달한다", () => {
    const config = {
      get: jest.fn(() => "test-secret"),
    } as unknown as ConfigService;
    const guard = new AppleAuthGuard(config);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          appleState: "issued-state",
          appleNonce: "issued-nonce",
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.getAuthenticateOptions(context)).toEqual({
      state: "issued-state",
      nonce: "issued-nonce",
    });
  });
});
