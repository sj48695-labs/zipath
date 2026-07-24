# #51 auth refresh token rotation

- 플랜식별자: `00B93859`
- 출처: `#51`

### 지시사항 (원본 보존)

> #51: AuthController의 refresh TODO 제거. AuthService에 refresh token 검증/재발급/rotation 로직을 구현하고, TypeORM User 엔티티와 migration에 refresh token 해시/만료/무효화에 필요한 컬럼을 추가한다. 기존 JWT/Auth 테스트를 확장해 유효 토큰 갱신, 만료/위조/재사용 실패, 기존 OAuth 로그인 토큰 발급 회귀를 검증한다.

### 현재 구조 분석

- `apps/api/src/auth/auth.controller.ts` 의 `refresh()` 는 zod로 body만 검증하고, 실제 처리는 `"TODO: refresh token rotation"` 으로 막혀 있다.
- `apps/api/src/auth/auth.service.ts` 는 OAuth 로그인 시 `accessToken` / `refreshToken` 을 둘 다 JWT로 발급하지만, refresh 토큰을 DB에 저장하지 않고 검증도 하지 않는다.
- `packages/db/src/entities/user.entity.ts` 의 `User` 엔티티에는 refresh token 상태를 담을 컬럼이 없다.
- `packages/db/src/migrations/1746489600000-InitialBaseline.ts` 와 `packages/db/src/migrations/1748000000000-AddUserInterestRegions.ts` 를 보면, 이 레포는 엔티티 변경과 별개로 명시적 migration 파일을 추가하는 방식이다.
- `apps/api/test/auth.service.spec.ts` 는 OAuth 로그인과 JWT payload 검증, 프로필/관심지역 흐름을 검증하지만 refresh rotation 은 없다.
- `apps/api/test/jwt.strategy.spec.ts` 는 `AuthService.validateJwtPayload()` 위임과 예외 전파만 다루므로, refresh 로직은 새 스펙이 필요하다.

### 변경 파일

- `packages/db/src/entities/user.entity.ts`
- `packages/db/src/migrations/<new>-AddUserRefreshTokenRotationColumns.ts` `# 새로 추가`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/test/auth.service.spec.ts`
- `apps/api/test/auth.controller.spec.ts` `# 새로 추가`
- `apps/api/test/jwt.strategy.spec.ts`

## Phase별 구현 계획

### Phase 1 (완료): User refresh token 스키마 추가

- 변경 파일:
  - `packages/db/src/entities/user.entity.ts`
  - `packages/db/src/migrations/<new>-AddUserRefreshTokenRotationColumns.ts` `# 새로 추가`
- 구현:
  - `User` 엔티티에 refresh token 상태를 저장할 nullable 컬럼 3개를 추가한다.
  - 컬럼은 `refreshTokenHash`, `refreshTokenExpiresAt`, `refreshTokenInvalidatedAt` 로 두고, rotation 전후 상태를 표현할 수 있게 한다.
  - migration 은 기존 데이터가 깨지지 않도록 nullable / default 전략을 명시하고, down 에서는 역순으로 제거한다.
  - `AuthService` 가 저장할 값의 형태와 migration 컬럼 타입이 일치하도록 한다.
- 테스트:
  - `npm run typecheck -w @zipath/db`
  - `npm run migration:show -w @zipath/db` 로 migration 파일이 인식되는지 확인한다.

### Phase 2 (완료): AuthService / AuthController refresh rotation 구현

- 의존성: Phase 1
- 변경 파일:
  - `apps/api/src/auth/auth.service.ts`
  - `apps/api/src/auth/auth.controller.ts`
- 구현:
  - `AuthService.validateOAuthLogin()` 에서 기존 OAuth 로그인 성공 시 refresh token 원문은 반환하되, DB 에는 해시와 만료시각을 저장한다.
  - refresh token 해시 생성/비교용 helper 를 `AuthService` 내부에 추가하고, rotation 시 기존 토큰 재사용을 막도록 현재 DB 상태와 비교한다.
  - `AuthService.refreshTokens(refreshToken: string)` 같은 전용 메서드를 추가해, 토큰 서명/만료 검증 후 DB 해시 일치 여부를 확인하고, 성공 시 새 access/refresh token 을 발급한 뒤 새 refresh token 해시로 교체한다.
  - refresh 실패 케이스는 `UnauthorizedException` 으로 통일해 controller 가 그대로 401 응답을 내보내게 한다.
  - `AuthController.refresh()` 는 TODO 반환을 제거하고, body 검증 후 서비스 메서드로 위임한다.
  - 기존 OAuth login 응답 구조(`accessToken`, `refreshToken`, `user`) 는 유지해서 웹 callback 흐름을 깨지 않는다.
- 테스트:
  - `apps/api/test/auth.service.spec.ts` 에 refresh 유효 토큰 갱신, 만료, 위조, 재사용 실패 케이스를 추가한다.
  - 같은 스펙에서 기존 OAuth 로그인 토큰 발급 회귀도 함께 확인한다.
  - `apps/api/test/auth.controller.spec.ts` 에 refresh body 검증과 service 위임을 얇게 검증한다.

### Phase 3 (완료): JWT/Auth 회귀 테스트 확장

- 의존성: Phase 2
- 변경 파일:
  - `apps/api/test/auth.service.spec.ts`
  - `apps/api/test/auth.controller.spec.ts` `# 새로 추가`
  - `apps/api/test/jwt.strategy.spec.ts`
- 구현:
  - `auth.service.spec.ts` 에서 신규 refresh rotation 경로를 중심으로, 정상 갱신 후 이전 refresh token 이 재사용 불가함을 검증한다.
  - `auth.controller.spec.ts` 에서 `refreshToken` 누락 시 400, 정상 입력 시 service 결과를 그대로 반환하는지 확인한다.
  - `jwt.strategy.spec.ts` 는 기존 access token payload 위임이 깨지지 않는지 유지하고, refresh 관련 변경이 JWT access path 에 영향을 주지 않는 회귀를 고정한다.
- 테스트:
  - `npm test -w @zipath/api`
  - `npm run test:e2e -w @zipath/api` 는 기존 auth e2e 가 없으므로 선택 검증으로 둔다.

## 테스트 계획

1. `npm run typecheck -w @zipath/db`
2. `npm test -w @zipath/api`
3. refresh rotation 시나리오를 서비스 스펙에서 단일 책임으로 검증한다.
4. OAuth 로그인 회귀는 `validateOAuthLogin()` 반환값과 저장 동작으로 고정한다.

## 자체 검토 메모

- refresh 관련 변경은 `User` 엔티티와 `AuthService` 에만 국한되지 않고, controller TODO 제거와 테스트 확장이 반드시 따라와야 한다.
- phase 를 DB 스키마 / 구현 / 테스트로 분리해, 각 phase 가 독립 커밋 단위가 되도록 했다.
- 공통 helper 추출이 필요한 파일은 현재 없으므로 P0 prep 은 만들지 않았다.
