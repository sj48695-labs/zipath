# #49 Apple 웹 OAuth 로그인

- 플랜식별자: `18FDBDA5`
- 출처: `#49`

## 범위

- Sign in with Apple **웹** 로그인만 추가한다. Google·Kakao·Naver URL 및 콜백 토큰 전달 계약은 유지한다.
- Apple의 `form_post` 콜백, `state`/`nonce` 검증, 취소·거부 처리, private relay 이메일과 최초 승인 때만 오는 이름·이메일을 다룬다.
- Expo/네이티브 앱 로그인과 다른 OAuth 공급자 추가는 제외한다.

## 현재 구조 분석

- API는 `apps/api/src/auth/auth.controller.ts`에서 `GET /auth/{provider}` 시작과 콜백을 처리하고, 전역 `/api` prefix 때문에 실제 공개 URL은 `/api/auth/{provider}`다. 성공 시 `FRONTEND_URL/auth/callback`으로 Zipath JWT 두 개를 query string으로 전달한다.
- `apps/api/src/auth/auth.module.ts`의 `conditionalOAuthProvider()`가 client ID가 없으면 공급자 strategy를 `null`로 등록하고 경고한다. `GoogleStrategy`/`GoogleAuthGuard`(`apps/api/src/auth/google.strategy.ts`, `google-auth.guard.ts`)가 Passport 확장 선례다.
- `packages/types/src/index.ts`의 `SsoProvider`와 `OAuthLoginInput`이 공급자 타입의 단일 원천이다. `AuthService.validateOAuthLogin()`은 이미 `{ provider, providerId }`로 사용자를 찾아, 재로그인에서 `null` 이메일·닉네임을 기존 값에 덮어쓰지 않는다.
- 단, `packages/db/src/entities/user.entity.ts`는 `providerId`에 단일 unique 제약을 두고 있어 위의 provider+providerId 식별과 불일치한다. Apple 추가 전에 복합 unique 제약으로 교정하고 PostgreSQL migration을 제공해야 한다.
- 웹 공급자 UI는 `apps/web/src/app/login/page.tsx`의 `OAUTH_PROVIDERS`다. 현재 `handleOAuthLogin()`은 존재하지 않는 `/auth/oauth/{provider}`로 이동하므로, API의 기존 `/auth/{provider}` 계약으로 고치고 회귀 테스트를 추가해야 한다. `LoginButton.tsx`는 `/login` 링크만 제공하므로 변경 대상이 아니다.

## 변경 파일

- `packages/db/src/entities/user.entity.ts`
- `packages/db/src/migrations/1787594035000-MakeUserProviderIdentityCompositeUnique.ts`
- `apps/api/test/auth.service.spec.ts`
- `packages/types/src/index.ts`
- `apps/api/package.json`, `package-lock.json`
- `apps/api/src/config/env.validation.ts`, `apps/api/test/env.validation.spec.ts`
- `apps/api/src/auth/apple.strategy.ts`, `apps/api/src/auth/apple-auth.guard.ts`, `apps/api/src/auth/auth.module.ts`, `apps/api/test/apple.strategy.spec.ts`
- `apps/api/src/auth/auth.controller.ts`, `apps/api/test/auth.controller.spec.ts`
- `apps/web/src/app/login/page.tsx`, `apps/web/src/app/login/oauth-providers.ts`, `apps/web/src/app/login/oauth-providers.test.ts`

## Phase별 구현 계획

### Phase 0 (완료): SSO 복합 식별 제약 정합화 (커밋 단위)

- 변경 파일: `packages/db/src/entities/user.entity.ts`, `packages/db/src/migrations/1787594035000-MakeUserProviderIdentityCompositeUnique.ts`, `packages/types/src/index.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/test/auth.service.spec.ts`
- 구현: Apple을 `SsoProvider`에 선행 추가해 이후 모든 OAuth 입력과 결과가 같은 union을 사용하게 한다. `User.providerId`의 단일 `unique: true`를 제거하고 TypeORM `@Index(["provider", "providerId"], { unique: true })`를 선언한다. 새 migration의 `up()`에서 PostgreSQL catalog로 기존 `providerId` 단일 unique constraint 이름을 조회·제거하고 `(provider, providerId)` unique constraint를 만든다; `down()`은 정확히 되돌린다. `InitialBaseline1746489600000`이 synchronize 기반이라 constraint 이름을 하드코딩하지 않는다. `AuthService.validateOAuthLogin()`의 `where: { provider, providerId }` 선례를 Apple provider로도 검증해 같은 provider ID가 서로 다른 provider와 충돌하지 않고, Apple 재로그인에서 `null` 프로필이 기존 정보를 보존함을 명시한다.
- 테스트: `apps/api/test/auth.service.spec.ts`의 `makeUser()`와 `should not overwrite email/nickname with null` 선례에 `provider: "apple"` 케이스를 추가한다. migration은 TypeORM/PostgreSQL SQL 형태를 검토해 기존 데이터 보존과 rollback을 확인한다.

### Phase 1 (완료): Apple 설정·공유 타입·의존성 추가 (커밋 단위)

- 변경 파일: `packages/types/src/index.ts`, `apps/api/package.json`, `package-lock.json`, `apps/api/src/config/env.validation.ts`, `apps/api/test/env.validation.spec.ts`
- 구현: `SsoProvider`에 `"apple"`을 추가해 `OAuthLoginInput`/`UserProfile`/`AuthTokens`가 자동으로 같은 union을 사용하게 한다. Passport 기반 Apple strategy가 Apple authorization code와 ID token을 검증할 수 있도록 필요한 runtime 패키지와 타입을 추가한다. `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CALLBACK_URL`을 optional env로 정의하고, credential 네 값은 all-or-none으로 검증하며 callback URL은 HTTPS Apple 웹 callback 값으로 설정한다. private key의 줄바꿈 환경변수 표현을 strategy에 안전하게 전달할 수 있도록 정규화 요구를 계약으로 문서화한다.
- 테스트: `env.validation.spec.ts`의 Google/Toss 쌍 검증 선례를 따라 Apple 전체 미설정·빈 문자열 미설정·일부만 설정 실패·전체 설정 통과·callback URL 기본값을 검사한다. 패키지 설치 뒤 API TypeScript 빌드가 새 dependency 타입을 해석하는지 확인한다.

### Phase 2 (완료): Passport Apple strategy와 state/nonce 보호 추가 (커밋 단위)

- 의존성: Phase 1
- 변경 파일: `apps/api/src/auth/apple.strategy.ts`, `apps/api/src/auth/apple-auth.guard.ts`, `apps/api/src/auth/auth.module.ts`, `apps/api/test/apple.strategy.spec.ts`
- 구현: `GoogleStrategy`/`GoogleAuthGuard` 패턴을 확장한 `AppleStrategy`와 `AppleAuthGuard`를 추가하고 `conditionalOAuthProvider(AppleStrategy, "APPLE_CLIENT_ID", "Apple")`로 등록한다. authorization request는 `scope: ["name", "email"]`, `response_mode: "form_post"`, cryptographically-random `state`와 `nonce`를 보낸다. 시작 요청에서 `state`·`nonce`를 httpOnly 보안 cookie에 보관하고, POST callback에서 만료·불일치·재사용을 거부한 뒤 즉시 cookie를 제거한다. Apple ID token의 issuer/audience/expiry/signature와 nonce를 검증하고, Apple subject를 `providerId`, private relay를 포함한 email, 최초 응답의 이름을 nickname으로 `OAuthLoginInput`에 매핑한다. Apple이 이름·`user` object를 재전송하지 않는 재로그인에도 null-safe 매핑을 유지한다.
- 테스트: `google.strategy.spec.ts`의 ConfigService mock/경고/`validate()` 선례를 따라 Apple 설정 누락 시 비활성화 경고, full profile 및 private relay mapping, 이름·이메일 없는 재로그인 mapping을 검증한다. Guard/strategy options가 `form_post`, `state`, `nonce`를 요청하고 callback state·nonce의 정상/불일치/만료/재사용과 ID-token claim 검증 실패를 거부하는지 검증한다.

### Phase 3 (완료): Apple form_post callback 및 OAuth URL 계약 추가 (커밋 단위)

- 의존성: Phase 2
- 변경 파일: `apps/api/src/auth/auth.controller.ts`, `apps/api/test/auth.controller.spec.ts`
- 구현: 기존 Google/Kakao/Naver start/callback 쌍을 보존한 채 `GET /auth/apple`과 `POST /auth/apple/callback`을 `AppleAuthGuard`로 추가한다. 성공 경로는 기존 `googleCallback()`의 `validateOAuthLogin()` 및 `/auth/callback?accessToken=&refreshToken=` redirect 계약을 재사용한다. Apple의 `user_cancelled_authorize` 및 거부 error는 토큰을 발급하지 않고 frontend 로그인 화면으로 안전한 오류 코드만 전달한다. form body를 신뢰하지 않고 Phase 2의 guard 검증을 통과한 `req.user`만 사용한다.
- 테스트: 새 controller unit test에서 Apple 성공 POST callback의 auth service 호출·token redirect, cancel/deny error의 token 없는 login redirect, state/nonce 거부를 검증한다. 그리고 기존 Google/Kakao/Naver `GET /auth/{provider}` 및 callback URL이 변경되지 않았음을 route/redirect 회귀 테스트로 고정한다.

### Phase 4 (완료): 웹 Apple 버튼과 로그인 URL 회귀 방지 (커밋 단위)

- 의존성: Phase 3
- 변경 파일: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/login/oauth-providers.ts`, `apps/web/src/app/login/oauth-providers.test.ts`
- 구현: 공급자 배열과 로그인 URL 생성 함수를 `oauth-providers.ts`로 추출한다. 여기에 Apple 버튼 메타데이터를 추가하고, `getOAuthLoginUrl()`이 `${NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/${provider}`를 생성하도록 해 현재의 잘못된 `/auth/oauth/{provider}`를 정정한다. `page.tsx`는 이 helper를 사용하고 Apple 취소·거부 query error를 재시도 가능한 안내로 표시한다. callback 성공과 `AuthContext`의 Zipath token 저장 흐름은 수정하지 않는다.
- 테스트: 현재 Jest가 `.test.ts`만 수집하는 설정을 그대로 사용해, 추출한 helper와 provider metadata에서 Apple이 노출되고 Google/Kakao/Naver/Apple 각각이 정확한 `/api/auth/{provider}` 시작 URL을 생성하며 API URL override가 유지됨을 검증한다. 로그인 페이지의 오류 안내는 기존 Next client component 패턴에 맞는 렌더링 검증을 추가할 수 있을 때만 별도 UI test로 확장한다.

## 테스트 계획

1. `npm test -w @zipath/api -- auth.service.spec.ts env.validation.spec.ts apple.strategy.spec.ts auth.controller.spec.ts`
2. `npm test -w @zipath/web -- oauth-providers.test.ts`
3. `npm run build -w @zipath/api` 및 `npm run build -w @zipath/web`로 Passport Apple dependency와 공유 `SsoProvider` 변경의 TypeScript 정합성을 확인한다.
4. Apple Developer의 실제 HTTPS callback 환경에서 최초 승인, private relay 선택, 재로그인, 취소·거부를 수동 확인한다. Apple은 `form_post`로 콜백하며 최초 승인에만 user object/이름을 제공하므로 이 시나리오는 자동 테스트 외 필수 확인 항목이다.
