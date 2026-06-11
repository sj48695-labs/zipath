import * as Joi from "joi";

const optionalEnv = Joi.string().empty("");

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

  // OAuth (Google) - 설정하지 않으면 비활성화, 설정 시 ID/SECRET 쌍 필수
  GOOGLE_CLIENT_ID: optionalEnv,
  GOOGLE_CLIENT_SECRET: optionalEnv,
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .default("http://localhost:4000/auth/google/callback"),

  // OAuth (Kakao) - 설정하지 않으면 비활성화, 설정 시 ID/SECRET 쌍 필수
  KAKAO_CLIENT_ID: optionalEnv,
  KAKAO_CLIENT_SECRET: optionalEnv,
  KAKAO_CALLBACK_URL: Joi.string()
    .uri()
    .default("http://localhost:4000/auth/kakao/callback"),

  // OAuth (Naver) - 설정하지 않으면 비활성화, 설정 시 ID/SECRET 쌍 필수
  NAVER_CLIENT_ID: optionalEnv,
  NAVER_CLIENT_SECRET: optionalEnv,
  NAVER_CALLBACK_URL: Joi.string()
    .uri()
    .default("http://localhost:4000/auth/naver/callback"),

  // 결제 (Toss) - 설정하지 않으면 데모 키/서버 검증 생략, 설정 시 쌍 필수
  TOSS_CLIENT_KEY: optionalEnv,
  TOSS_SECRET_KEY: optionalEnv,
})
  .and("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
  .and("KAKAO_CLIENT_ID", "KAKAO_CLIENT_SECRET")
  .and("NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET")
  .and("TOSS_CLIENT_KEY", "TOSS_SECRET_KEY");

export const envValidationOptions = {
  // 정의되지 않은 env 도 허용 (시스템 env 등)
  allowUnknown: true,
  // 모든 검증 오류를 한 번에 보고
  abortEarly: false,
};
