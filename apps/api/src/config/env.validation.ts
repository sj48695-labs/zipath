import * as Joi from "joi";

/**
 * 앱 부팅 시 환경변수를 검증하는 Joi 스키마.
 *
 * - 필수 env 누락/형식 오류 시 ConfigModule 이 즉시 예외를 던져 부팅을 중단한다.
 * - production 에서만 필요한 OAuth/결제 키는 NODE_ENV 에 따라 조건부로 요구한다.
 * - 정의되지 않은 env 는 그대로 통과시킨다 (allowUnknown).
 */
export const envValidationSchema = Joi.object({
  // 실행 환경
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(4000),

  // 항상 필수
  DATABASE_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).required(),
  DATA_GO_KR_API_KEY: Joi.string().required(),

  // JWT - production 에서는 기본 시크릿 사용 금지
  JWT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.string().default("zipath-dev-secret"),
  }),

  // 프론트엔드 리다이렉트 URL
  FRONTEND_URL: Joi.string().uri().default("http://localhost:3000"),

  // OAuth (Google) - production 에서만 필수
  GOOGLE_CLIENT_ID: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .default("http://localhost:4000/auth/google/callback"),

  // OAuth (Kakao) - production 에서만 필수
  KAKAO_CLIENT_ID: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  KAKAO_CLIENT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  KAKAO_CALLBACK_URL: Joi.string()
    .uri()
    .default("http://localhost:4000/auth/kakao/callback"),

  // OAuth (Naver) - production 에서만 필수
  NAVER_CLIENT_ID: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  NAVER_CLIENT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  NAVER_CALLBACK_URL: Joi.string()
    .uri()
    .default("http://localhost:4000/auth/naver/callback"),

  // 결제 (Toss) - production 에서만 필수
  TOSS_CLIENT_KEY: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  TOSS_SECRET_KEY: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export const envValidationOptions = {
  // 정의되지 않은 env 도 허용 (시스템 env 등)
  allowUnknown: true,
  // 모든 검증 오류를 한 번에 보고
  abortEarly: false,
};
