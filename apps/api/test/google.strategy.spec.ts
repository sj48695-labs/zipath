import { ConfigService } from "@nestjs/config";
import { GoogleStrategy } from "../src/auth/google.strategy";

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
}

interface GoogleOAuthUser {
  provider: string;
  providerId: string;
  email: string | null;
  nickname: string | null;
}

/**
 * Helper: ConfigService 모킹
 *
 * GoogleStrategy 생성자는 ConfigService에서 OAuth 환경변수를 읽는다.
 * passport-google-oauth20의 super(...)는 clientID/clientSecret이 없으면
 * 즉시 throw 하므로 더미 값을 채워준다.
 */
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

  beforeEach(() => {
    strategy = new GoogleStrategy(makeConfig());
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
      const [err, user] = done.mock.calls[0] as [unknown, GoogleOAuthUser];
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

      const [, user] = done.mock.calls[0] as [unknown, GoogleOAuthUser];
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

      const [, user] = done.mock.calls[0] as [unknown, GoogleOAuthUser];
      expect(user.email).toBeNull();
    });

    it("displayName이 undefined이면 nickname은 null", () => {
      const profile = {
        id: "google-000",
        emails: [{ value: "x@y.com", verified: true }],
      } as unknown as GoogleProfile;
      const done = jest.fn();

      strategy.validate("a", "r", profile, done);

      const [, user] = done.mock.calls[0] as [unknown, GoogleOAuthUser];
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

      const [, user] = done.mock.calls[0] as [unknown, GoogleOAuthUser];
      expect(user.provider).toBe("google");
      expect(user.providerId).toBe("abc-xyz-999");
    });
  });
});
