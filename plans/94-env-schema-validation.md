## Plan #94 NestJS 앱 시작 시 환경변수 스키마 검증 추가

- 플랜식별자: `8C7B9D54`
- 출처: GitHub Issue #94 (https://github.com/sj48695-labs/zipath/issues/94)

### 지시사항 (원본 보존)

현재 환경변수 처리 방식이 일관되지 않음.

- `app.module.ts`, `auth.module.ts`에서 `process.env` 직접 접근과 `ConfigService` 혼용
- 앱 시작 시 필수 환경변수 누락 여부를 검증하는 코드 없음
- 운영 환경에서 `DATA_GO_KR_API_KEY`, `JWT_SECRET` 등이 없어도 앱이 정상 기동됨

완료 조건 (AC):
- `@nestjs/config`의 `validationSchema`(Joi) 또는 `validate` 옵션으로 필수 env 목록 검증
- 필수값 누락 시 앱 시작 단계에서 명확한 오류 메시지와 함께 종료
- `auth.module.ts`에서 `process.env[envKey]` 직접 접근 제거 → `ConfigService` 사용
- `.env.example`에 모든 검증 대상 변수 주석 포함
- 기존 유닛/E2E 테스트 통과

관련 파일: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/src/auth/auth.module.ts`, `.env.example`

### 결정 사항 (Q&A)

- Q: Joi `validationSchema` vs `validate` 함수? → A: Joi `validationSchema` 채택. 선언적이고 조건부/쌍 검증(`.when`, `.and`) 표현이 간결.
- Q: 검증 실패 시 종료 방식? → A: Joi `abortEarly: false`로 모든 오류를 한 번에 수집, NestJS `ConfigModule.forRoot`가 검증 오류 시 부팅 단계에서 throw → 프로세스 종료.
- Q: OAuth/Toss 같은 선택 기능 키 처리? → A: 미설정 허용하되, 설정 시 ID/SECRET 쌍이 모두 있어야 함(`.and()`). 빈 문자열은 미설정으로 처리(`Joi.string().empty("")`).
- Q: JWT_SECRET? → A: production 에서는 필수, 그 외에는 dev 기본값(`zipath-dev-secret`) 허용(`.when("NODE_ENV")`).
- Q: 정의되지 않은 시스템 env? → A: `allowUnknown: true`로 통과.

### 구현 단계 (Phase)

1. [x] Phase 1: Joi env 검증 스키마 정의 — `apps/api/src/config/env.validation.ts` 신규. `envValidationSchema`(필수/조건부/쌍 검증), `envValidationOptions`(allowUnknown, abortEarly:false). `joi` 의존성 추가(`apps/api/package.json`). 커밋: `feat(api): #94 Joi 환경변수 검증 스키마 추가`
2. [x] Phase 2: ConfigModule 에 검증 스키마 연결 — `apps/api/src/app.module.ts`에서 `ConfigModule.forRoot`에 `validationSchema`/`validationOptions` 주입. 커밋: `feat(api): #94 ConfigModule 부팅 검증 활성화`
3. [x] Phase 3: process.env 직접 접근 제거 — `auth.module.ts`(envKey 직접 접근 → `config.get`), `main.ts`(PORT → ConfigService). 커밋: `fix(api): #94 process.env 직접 접근 제거 → ConfigService 사용`
4. [x] Phase 4: .env.example 정리 — 모든 검증 대상 변수와 [필수]/선택 주석 추가(`apps/api/.env.example`). 커밋: `docs(api): #94 .env.example 검증 대상 변수 주석`
5. [x] Phase 5: 검증 스키마 유닛 테스트 — `apps/api/test/env.validation.spec.ts` 신규(필수 누락/기본값/production 조건부/쌍 검증/allowUnknown). 커밋: `test(api): #94 env 검증 스키마 테스트`

### 영향 범위

- `apps/api/src/config/env.validation.ts` (신규)
- `apps/api/src/app.module.ts`, `apps/api/src/auth/auth.module.ts`, `apps/api/src/main.ts`
- `apps/api/.env.example`, `apps/api/package.json`, `package-lock.json`
- `apps/api/test/env.validation.spec.ts` (신규)

### 테스트 계획

- 유닛: `npm test -w @zipath/api` — env.validation.spec 포함 전체 통과 (현재 13 suites / 127 tests passed).
- 린트: `turbo lint --filter=@zipath/api` 통과.
- 수동: 필수 env 누락 상태로 부팅 시 명확한 오류 메시지 출력 후 종료 확인.

### 검증 결과 (이미 구현 완료됨)

모든 Phase 가 현재 브랜치(`94-env-schema-validation`)에 이미 구현·커밋되어 있음.
유닛 테스트 127개 전부 통과, `apps/api/src` 내 `process.env` 직접 접근 0건, 린트 통과 확인.
