# #51 Auth refresh token rotation

- 플랜식별자: `fc35ede1`
- 출처: `#51`

## 현재 구조 분석

- `apps/api/src/auth/auth.controller.ts` 에 `POST /auth/refresh` 엔드포인트가 있고, `refreshSchema` 로 `refreshToken` 입력을 검증한다.
- `apps/api/src/auth/auth.service.ts` 에는 이미 `validateOAuthLogin()`, `refreshTokens()`, `verifyRefreshToken()`, `getRefreshTokenState()`, `persistRefreshToken()`, `invalidateRefreshTokenSession()` 이 분리되어 있어, 회전 로직의 핵심 경계가 잡혀 있다.
- `packages/db/src/entities/user.entity.ts` 와 `packages/db/src/migrations/1749000000000-AddUserRefreshTokenRotationColumns.ts` 에는 `refreshTokenHash`, `refreshTokenExpiresAt`, `refreshTokenInvalidatedAt` 컬럼이 추가되어 있다.
- `apps/api/test/auth.service.spec.ts`, `apps/api/test/auth.controller.spec.ts`, `apps/api/test/jwt.strategy.spec.ts` 에 refresh 흐름과 OAuth/JWT 회귀 테스트가 이미 일부 구성되어 있다.

## 변경 파일

- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `packages/db/src/entities/user.entity.ts`
- `packages/db/src/migrations/1749000000000-AddUserRefreshTokenRotationColumns.ts`
- `apps/api/test/auth.service.spec.ts`
- `apps/api/test/auth.controller.spec.ts`
- `apps/api/test/jwt.strategy.spec.ts`

## Phase별 구현 계획

### Phase 1: refresh token rotation 코어 구현

- 변경 파일: `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, `packages/db/src/entities/user.entity.ts`, `packages/db/src/migrations/1749000000000-AddUserRefreshTokenRotationColumns.ts`
- 구현:
  - `AuthController.refresh()` 에서 `refreshToken` 요청 바디를 받아 `AuthService.refreshTokens()` 로 넘기는 흐름을 유지하고, TODO 잔재가 있다면 제거한다.
  - `AuthService.refreshTokens()` 에서 JWT 서명 검증, DB 저장 해시 비교, 만료 검사, 재사용 탐지를 수행하고 유효 시 access/refresh token 을 재발급한다.
  - 재사용으로 판단되면 기존 세션을 무효화하고, 해시/만료/무효화 시각을 `User` 엔티티 상태로 저장한다.
  - `User` 엔티티와 migration 에 refresh token rotation 상태 컬럼을 반영해 기존 사용자 데이터를 깨지 않도록 nullable 설계를 유지한다.
- 테스트:
  - refresh 성공 시 access/refresh token 이 재발급되는지 확인한다.
  - 만료, 위조, 재사용 케이스가 각각 Unauthorized 로 실패하는지 확인한다.
  - OAuth 로그인 시 최초 토큰 발급 후 refresh token 상태가 저장되는지 확인한다.

### Phase 2: 회귀 테스트 보강

- 의존성: Phase 1
- 변경 파일: `apps/api/test/auth.service.spec.ts`, `apps/api/test/auth.controller.spec.ts`, `apps/api/test/jwt.strategy.spec.ts`
- 구현:
  - `auth.service.spec.ts` 에서 `refreshTokens()` 의 유효/만료/위조/재사용 시나리오를 고정하고, `validateOAuthLogin()` 의 access token 1h / refresh token 7d 생성 규칙을 회귀로 묶는다.
  - `auth.controller.spec.ts` 에서 refresh endpoint 의 입력 검증과 `AuthService.refreshTokens()` 위임을 검증한다.
  - `jwt.strategy.spec.ts` 에서 JWT payload 검증 경로가 `AuthService.validateJwtPayload()` 로 연결되는지 유지한다.
- 테스트:
  - `npm test -w @zipath/api`
  - 필요 시 refresh 관련 개별 스펙만 우선 실행해 회귀 범위를 좁힌다.

## 테스트 계획

1. `npm test -w @zipath/api`
2. refresh 관련 스펙만 실패 시점에 맞춰 재실행한다.
3. OAuth 로그인 후 refresh token 발급/갱신 회귀가 유지되는지 확인한다.
