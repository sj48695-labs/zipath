import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "../src/auth/jwt.strategy";
import { AuthService } from "../src/auth/auth.service";
import { User } from "@zipath/db";

/**
 * #62 / #72 — JwtStrategy ↔ AuthRequest 타입 호환 테스트
 *
 * NotificationController 등에서 사용하는 AuthRequest = { user: { id: number } }와
 * JwtStrategy.validate()가 반환하는 객체가 호환되는지 검증한다.
 */

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "test@example.com",
    nickname: "테스터",
    provider: "google",
    providerId: "google-123",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    lastActiveAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeConfig(): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === "JWT_SECRET") return "test-secret";
      return undefined;
    }),
  } as unknown as ConfigService;
}

describe("JwtStrategy", () => {
  let authService: { validateJwtPayload: jest.Mock };
  let strategy: JwtStrategy;

  beforeEach(() => {
    authService = {
      validateJwtPayload: jest.fn(),
    };
    strategy = new JwtStrategy(makeConfig(), authService as unknown as AuthService);
  });

  describe("validate", () => {
    it("AuthService.validateJwtPayload를 동일 payload로 호출", async () => {
      const user = makeUser();
      authService.validateJwtPayload.mockResolvedValue(user);

      await strategy.validate({ sub: 1, email: "test@example.com" });

      expect(authService.validateJwtPayload).toHaveBeenCalledWith({
        sub: 1,
        email: "test@example.com",
      });
    });

    it("반환된 user는 AuthRequest.user 구조({ id: number })와 호환", async () => {
      const user = makeUser({ id: 42 });
      authService.validateJwtPayload.mockResolvedValue(user);

      const result = await strategy.validate({ sub: 42, email: "u@z.com" });

      // AuthRequest = { user: { id: number } } 호환성 — id가 number 타입으로 존재
      expect(result).toBeDefined();
      expect(typeof result.id).toBe("number");
      expect(result.id).toBe(42);
    });

    it("payload.email이 null이어도 정상 처리", async () => {
      const user = makeUser({ email: null });
      authService.validateJwtPayload.mockResolvedValue(user);

      const result = await strategy.validate({ sub: 1, email: null });

      expect(authService.validateJwtPayload).toHaveBeenCalledWith({
        sub: 1,
        email: null,
      });
      expect(result.id).toBe(1);
    });

    it("validateJwtPayload가 null/undefined 반환 시 UnauthorizedException", async () => {
      authService.validateJwtPayload.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 999, email: null }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("AuthService가 예외를 던지면 그대로 전파", async () => {
      authService.validateJwtPayload.mockRejectedValue(
        new UnauthorizedException("유저를 찾을 수 없습니다."),
      );

      await expect(
        strategy.validate({ sub: 999, email: null }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
