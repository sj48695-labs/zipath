import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuthLoginInput } from "@zipath/types";
import { GoogleProfile, GoogleStrategy } from "../src/auth/google.strategy";

function makeConfig(overrides: Record<string, string | undefined> = {}): ConfigService {
  const values: Record<string, string | undefined> = {
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    GOOGLE_CALLBACK_URL: "http://localhost:4000/auth/google/callback",
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe("GoogleStrategy", () => {
  let strategy: GoogleStrategy;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    strategy = new GoogleStrategy(makeConfig());
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("constructor", () => {
    it("env 모두 설정 시 경고 로그 미출력", () => {
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("GOOGLE_CLIENT_ID 누락 시 경고 로그 출력", () => {
      warnSpy.mockClear();
      try {
        new GoogleStrategy(makeConfig({ GOOGLE_CLIENT_ID: undefined }));
      } catch {
        // passport 라이브러리가 throw하더라도 warn은 super 호출 전에 찍힘
      }
      expect(warnSpy).toHaveBeenCalled();
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toContain("GOOGLE_CLIENT_ID");
    });

    it("GOOGLE_CLIENT_SECRET 누락 시 경고 로그 출력", () => {
      warnSpy.mockClear();
      try {
        new GoogleStrategy(makeConfig({ GOOGLE_CLIENT_SECRET: undefined }));
      } catch {
        // passport 라이브러리가 throw하더라도 warn은 super 호출 전에 찍힘
      }
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("validate", () => {
    it("Google 프로필을 OAuthUser로 변환해 done(null, user) 호출", () => {
      const profile: GoogleProfile = {
        id: "google-123",
        displayName: "테스터",
        emails: [{ value: "test@example.com", verified: true }],
      };
      const done = jest.fn();

      strategy.validate("access", "refresh", profile, done);

      expect(done).toHaveBeenCalledTimes(1);
      const [err, user] = done.mock.calls[0] as [unknown, OAuthLoginInput];
      expect(err).toBeNull();
      expect(user).toEqual({
        provider: "google",
        providerId: "google-123",
        email: "test@example.com",
        nickname: "테스터",
      });
    });

    it("emails 배열이 없으면 email은 null", () => {
      const profile: GoogleProfile = {
        id: "google-456",
        displayName: "닉네임",
      };
      const done = jest.fn();

      strategy.validate("a", "r", profile, done);

      const [, user] = done.mock.calls[0] as [unknown, OAuthLoginInput];
      expect(user.email).toBeNull();
      expect(user.nickname).toBe("닉네임");
    });

    it("emails 배열이 비어있으면 email은 null", () => {
      const profile: GoogleProfile = {
        id: "google-789",
        displayName: "닉",
        emails: [],
      };
      const done = jest.fn();

      strategy.validate("a", "r", profile, done);

      const [, user] = done.mock.calls[0] as [unknown, OAuthLoginInput];
      expect(user.email).toBeNull();
    });

    it("displayName이 undefined이면 nickname은 null", () => {
      const profile = {
        id: "google-000",
        emails: [{ value: "x@y.com", verified: true }],
      } as unknown as GoogleProfile;
      const done = jest.fn();

      strategy.validate("a", "r", profile, done);

      const [, user] = done.mock.calls[0] as [unknown, OAuthLoginInput];
      expect(user.nickname).toBeNull();
      expect(user.email).toBe("x@y.com");
    });

    it("provider는 항상 'google', providerId는 profile.id와 일치", () => {
      const profile: GoogleProfile = {
        id: "abc-xyz-999",
        displayName: "n",
        emails: [{ value: "a@b.com", verified: true }],
      };
      const done = jest.fn();

      strategy.validate("a", "r", profile, done);

      const [, user] = done.mock.calls[0] as [unknown, OAuthLoginInput];
      expect(user.provider).toBe("google");
      expect(user.providerId).toBe("abc-xyz-999");
    });
  });
});
