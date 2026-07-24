import { UnauthorizedException } from "@nestjs/common";
import { createHash } from "crypto";
import { User } from "@zipath/db";
import { AuthService } from "../src/auth/auth.service";

interface JwtPayload {
  sub: number;
  email: string | null;
}

type TestUser = User & {
  interestRegions: string[];
};

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Helper: 최소한의 User 엔티티 생성 */
function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 1,
    email: "test@example.com",
    nickname: "테스터",
    provider: "google",
    providerId: "google-123",
    interestRegions: [],
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
    refreshTokenInvalidatedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    lastActiveAt: new Date("2026-01-01"),
    ...overrides,
  };
}

interface MockRepository {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

interface MockJwtService {
  sign: jest.Mock<string, [JwtPayload, { expiresIn: string }]>;
  verifyAsync: jest.Mock<Promise<JwtPayload>, [string]>;
}

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: MockRepository;
  let jwtService: MockJwtService;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    };

    service = new AuthService(
      userRepo as never,
      jwtService as never,
    );
  });

  // ----- validateOAuthLogin -----
  describe("validateOAuthLogin", () => {
    const profile = {
      provider: "google" as const,
      providerId: "google-123",
      email: "test@example.com",
      nickname: "테스터",
    };

    it("should create new user when not found", async () => {
      const newUser = makeUser();
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(newUser);
      userRepo.save.mockResolvedValue(newUser);
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await service.validateOAuthLogin(profile);

      expect(userRepo.create).toHaveBeenCalledWith({
        email: "test@example.com",
        nickname: "테스터",
        provider: "google",
        providerId: "google-123",
      });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: hashRefreshToken("refresh-token"),
          refreshTokenExpiresAt: expect.any(Date),
          refreshTokenInvalidatedAt: null,
        }),
      );
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user.id).toBe(1);
    });

    it("should update existing user on login", async () => {
      const existingUser = makeUser();
      userRepo.findOne.mockResolvedValue(existingUser);
      userRepo.save.mockResolvedValue(existingUser);
      jwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await service.validateOAuthLogin(profile);

      expect(userRepo.create).not.toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toBe("access-token");
    });

    it("should update email and nickname for existing user", async () => {
      const existingUser = makeUser({
        email: "old@example.com",
        nickname: "옛닉",
      });
      userRepo.findOne.mockResolvedValue(existingUser);
      userRepo.save.mockResolvedValue(existingUser);
      jwtService.sign.mockReturnValue("token");

      await service.validateOAuthLogin({
        ...profile,
        email: "new@example.com",
        nickname: "새닉",
      });

      expect(existingUser.email).toBe("new@example.com");
      expect(existingUser.nickname).toBe("새닉");
    });

    it("should not overwrite email/nickname with null", async () => {
      const existingUser = makeUser({
        email: "keep@example.com",
        nickname: "유지",
      });
      userRepo.findOne.mockResolvedValue(existingUser);
      userRepo.save.mockResolvedValue(existingUser);
      jwtService.sign.mockReturnValue("token");

      await service.validateOAuthLogin({
        ...profile,
        email: null,
        nickname: null,
      });

      expect(existingUser.email).toBe("keep@example.com");
      expect(existingUser.nickname).toBe("유지");
    });
  });

  // ----- refreshTokens -----
  describe("refreshTokens", () => {
    it("should rotate refresh token when valid", async () => {
      const user = makeUser({
        refreshTokenHash: hashRefreshToken("current-refresh-token"),
        refreshTokenExpiresAt: new Date("2026-12-31T00:00:00.000Z"),
      });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((saved: TestUser) => Promise.resolve(saved));
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        email: "test@example.com",
      });
      jwtService.sign
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce("new-refresh-token");

      const result = await service.refreshTokens("current-refresh-token");

      expect(jwtService.verifyAsync).toHaveBeenCalledWith("current-refresh-token");
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: hashRefreshToken("new-refresh-token"),
          refreshTokenExpiresAt: expect.any(Date),
          refreshTokenInvalidatedAt: null,
        }),
      );
      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
    });

    it("should reject expired refresh token", async () => {
      const user = makeUser({
        refreshTokenHash: hashRefreshToken("expired-refresh-token"),
        refreshTokenExpiresAt: new Date("2025-01-01T00:00:00.000Z"),
      });
      userRepo.findOne.mockResolvedValue(user);
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        email: "test@example.com",
      });

      await expect(
        service.refreshTokens("expired-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("should reject forged refresh token", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("invalid signature"));

      await expect(
        service.refreshTokens("forged-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
      expect(userRepo.findOne).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("should reject reused refresh token after rotation", async () => {
      const user = makeUser({
        refreshTokenHash: hashRefreshToken("current-refresh-token"),
        refreshTokenExpiresAt: new Date("2026-12-31T00:00:00.000Z"),
      });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((saved: TestUser) => Promise.resolve(saved));
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        email: "test@example.com",
      });
      jwtService.sign
        .mockReturnValueOnce("rotated-access-token")
        .mockReturnValueOnce("rotated-refresh-token");

      await service.refreshTokens("current-refresh-token");

      await expect(
        service.refreshTokens("current-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
      expect(user.refreshTokenInvalidatedAt).toBeInstanceOf(Date);
      expect(user.refreshTokenHash).toBeNull();
      expect(user.refreshTokenExpiresAt).toBeNull();
      expect(userRepo.save).toHaveBeenCalledTimes(2);

      await expect(
        service.refreshTokens("rotated-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ----- JWT generation -----
  describe("JWT generation", () => {
    it("should generate access token with 1h expiry", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      jwtService.sign.mockReturnValue("token");

      await service.validateOAuthLogin({
        provider: "kakao",
        providerId: "kakao-456",
        email: null,
        nickname: null,
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 1, email: "test@example.com" },
        { expiresIn: "1h" },
      );
    });

    it("should generate refresh token with 7d expiry", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      jwtService.sign.mockReturnValue("token");

      await service.validateOAuthLogin({
        provider: "kakao",
        providerId: "kakao-456",
        email: null,
        nickname: null,
      });

      expect(jwtService.sign.mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({
          sub: 1,
          email: "test@example.com",
          jti: expect.any(String),
        }),
      );
      expect(jwtService.sign.mock.calls[1]?.[1]).toEqual({ expiresIn: "7d" });
    });

    it("should include user info in token response", async () => {
      const user = makeUser({
        id: 42,
        email: "u@z.com",
        nickname: "닉",
        provider: "naver",
      });
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      jwtService.sign.mockReturnValue("tok");

      const result = await service.validateOAuthLogin({
        provider: "naver",
        providerId: "naver-1",
        email: "u@z.com",
        nickname: "닉",
      });

      expect(result.user).toEqual({
        id: 42,
        email: "u@z.com",
        nickname: "닉",
        provider: "naver",
      });
    });
  });

  // ----- validateJwtPayload -----
  describe("validateJwtPayload", () => {
    it("should return user and update lastActiveAt", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.validateJwtPayload({
        sub: 1,
        email: "test@example.com",
      });

      expect(result.id).toBe(1);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.validateJwtPayload({ sub: 999, email: null }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ----- getProfile -----
  describe("getProfile", () => {
    it("should return profile for existing user", async () => {
      const user = makeUser({ interestRegions: ["서울 강남구"] });
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getProfile(1);

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        nickname: "테스터",
        provider: "google",
        interestRegions: ["서울 강남구"],
        createdAt: "2026-01-01T00:00:00.000Z",
        lastActiveAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("should throw UnauthorizedException when user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ----- updateInterestRegions -----
  describe("updateInterestRegions", () => {
    it("should save and return updated interest regions", async () => {
      const user = makeUser({ interestRegions: ["서울 강남구"] });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((saved: TestUser) => Promise.resolve(saved));

      const result = await service.updateInterestRegions(1, [
        "서울 강남구",
        "경기 성남시",
      ]);

      expect(user.interestRegions).toEqual(["서울 강남구", "경기 성남시"]);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(result.interestRegions).toEqual(["서울 강남구", "경기 성남시"]);
    });

    it("should trim, drop empties and dedupe regions", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((saved: TestUser) => Promise.resolve(saved));

      const result = await service.updateInterestRegions(1, [
        "  서울 강남구  ",
        "",
        "서울 강남구",
        "   ",
        "부산 해운대구",
      ]);

      expect(result.interestRegions).toEqual([
        "서울 강남구",
        "부산 해운대구",
      ]);
    });

    it("should allow clearing all regions with empty array", async () => {
      const user = makeUser({ interestRegions: ["서울 강남구"] });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((saved: TestUser) => Promise.resolve(saved));

      const result = await service.updateInterestRegions(1, []);

      expect(result.interestRegions).toEqual([]);
    });

    it("should throw UnauthorizedException when user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateInterestRegions(999, ["서울 강남구"]),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
