import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "../src/auth/auth.controller";

interface MockAuthService {
  refreshTokens: jest.Mock;
}

function makeConfig(): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === "FRONTEND_URL") return "http://localhost:3000";
      return undefined;
    }),
  } as unknown as ConfigService;
}

describe("AuthController", () => {
  let controller: AuthController;
  let authService: MockAuthService;

  beforeEach(() => {
    authService = {
      refreshTokens: jest.fn(),
    };

    controller = new AuthController(authService as never, makeConfig());
  });

  describe("refresh", () => {
    it("should reject when refreshToken is missing", async () => {
      await expect(controller.refresh({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should reject when refreshToken is empty", async () => {
      await expect(controller.refresh({ refreshToken: "" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should delegate to AuthService.refreshTokens", async () => {
      authService.refreshTokens.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: {
          id: 1,
          email: "test@example.com",
          nickname: "테스터",
          provider: "google",
        },
      });

      const result = await controller.refresh({
        refreshToken: "current-refresh-token",
      });

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        "current-refresh-token",
      );
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: {
          id: 1,
          email: "test@example.com",
          nickname: "테스터",
          provider: "google",
        },
      });
    });
  });
});
