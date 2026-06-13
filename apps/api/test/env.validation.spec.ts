import {
  envValidationSchema,
  envValidationOptions,
} from "../src/config/env.validation";

function validate(env: Record<string, unknown>) {
  return envValidationSchema.validate(env, envValidationOptions);
}

describe("envValidationSchema", () => {
  const baseEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/zipath",
    DATA_GO_KR_API_KEY: "test-api-key",
  };

  describe("필수 환경변수", () => {
    it("DATABASE_URL 누락 시 에러", () => {
      const { error } = validate({ DATA_GO_KR_API_KEY: "key" });
      expect(error).toBeDefined();
      expect(error?.message).toContain("DATABASE_URL");
    });

    it("DATA_GO_KR_API_KEY 누락 시 에러", () => {
      const { error } = validate({
        DATABASE_URL: "postgresql://localhost:5432/db",
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain("DATA_GO_KR_API_KEY");
    });

    it("DATABASE_URL 이 postgresql URI 가 아니면 에러", () => {
      const { error } = validate({ ...baseEnv, DATABASE_URL: "not-a-url" });
      expect(error).toBeDefined();
      expect(error?.message).toContain("DATABASE_URL");
    });

    it("필수 env 가 모두 있으면 통과 (development)", () => {
      const { error } = validate(baseEnv);
      expect(error).toBeUndefined();
    });
  });

  describe("기본값", () => {
    it("NODE_ENV 기본값은 development", () => {
      const { value } = validate(baseEnv);
      expect(value.NODE_ENV).toBe("development");
    });

    it("PORT 기본값은 4000", () => {
      const { value } = validate(baseEnv);
      expect(value.PORT).toBe(4000);
    });

    it("JWT_SECRET 기본값은 zipath-dev-secret (non-prod)", () => {
      const { value } = validate(baseEnv);
      expect(value.JWT_SECRET).toBe("zipath-dev-secret");
    });

    it("PORT 는 숫자로 변환된다", () => {
      const { value } = validate({ ...baseEnv, PORT: "5000" });
      expect(value.PORT).toBe(5000);
    });
  });

  describe("production 조건부 필수", () => {
    const prodBase = { ...baseEnv, NODE_ENV: "production" };

    it("production 에서 JWT_SECRET 누락 시 에러", () => {
      const { error } = validate(prodBase);
      expect(error).toBeDefined();
      expect(error?.message).toContain("JWT_SECRET");
    });

    it("production 에서 선택 기능 키가 없어도 JWT_SECRET 이 있으면 통과", () => {
      const { error } = validate({ ...prodBase, JWT_SECRET: "secret" });
      expect(error).toBeUndefined();
    });

    it("production 에서 모든 선택 기능 키가 있으면 통과", () => {
      const { error } = validate({
        ...prodBase,
        JWT_SECRET: "prod-secret",
        GOOGLE_CLIENT_ID: "g",
        GOOGLE_CLIENT_SECRET: "g",
        KAKAO_CLIENT_ID: "k",
        KAKAO_CLIENT_SECRET: "k",
        NAVER_CLIENT_ID: "n",
        NAVER_CLIENT_SECRET: "n",
        TOSS_CLIENT_KEY: "t",
        TOSS_SECRET_KEY: "t",
      });
      expect(error).toBeUndefined();
    });
  });

  describe("선택 기능 키 쌍 검증", () => {
    it("OAuth client id 만 있으면 에러", () => {
      const { error } = validate({ ...baseEnv, GOOGLE_CLIENT_ID: "g" });
      expect(error).toBeDefined();
      expect(error?.message).toContain("GOOGLE_CLIENT_SECRET");
    });

    it("빈 문자열 선택 키는 미설정으로 처리한다", () => {
      const { error, value } = validate({
        ...baseEnv,
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      });
      expect(error).toBeUndefined();
      expect(value.GOOGLE_CLIENT_ID).toBeUndefined();
      expect(value.GOOGLE_CLIENT_SECRET).toBeUndefined();
    });

    it("Toss 키도 한쪽만 있으면 에러", () => {
      const { error } = validate({ ...baseEnv, TOSS_SECRET_KEY: "secret" });
      expect(error).toBeDefined();
      expect(error?.message).toContain("TOSS_CLIENT_KEY");
    });
  });

  describe("allowUnknown", () => {
    it("정의되지 않은 env 는 통과시킨다", () => {
      const { error } = validate({ ...baseEnv, SOME_RANDOM_VAR: "x" });
      expect(error).toBeUndefined();
    });
  });
});
