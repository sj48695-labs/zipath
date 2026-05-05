## Plan #62 Google OAuth 로그인

- 플랜식별자: `78C55A9C`
- 출처: GitHub Issue #62 (https://github.com/sj48695-labs/zipath/issues/62)

### 지시사항 (원본 보존)

**PM 구현 지침**
> #62: Passport Google Strategy 구현. apps/api/src/auth/google.strategy.ts 신규. JWT payload는 기존 #72 AuthRequest 타입과 동일하게. 환경변수 GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL 필요.

**이슈 본문 (Phase 2 - Task 2.1, Parent: #54)**
> Passport.js + Google Strategy로 Google OAuth 로그인을 구현합니다.
> - Passport.js Google Strategy 설정
> - JWT 토큰 발급
> - Auth 모듈/서비스 구현
>
> 변경 파일: `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/google.strategy.ts`, `apps/api/src/auth/auth.service.ts`

**사용자 피드백 (최우선 반영)**
- Phase 1 (announcement + auth) 함께 진행 OK → 본 플랜은 #62 단독 처리
- #62 이미 strategy 코드 존재 → 닫아도 될지 확인 필요
- PR #71 (테스트 보강) 이미 승인 완료
- #67 (Rate Limiting) 이미 ThrottlerModule 적용됨
- #51 (Refresh Token Rotation) → "알아서 해줘" (별도 이슈, 본 플랜 범위 밖)

### 결정 사항 (Q&A)

**Q1. 이미 `google.strategy.ts`가 존재하는데 새로 작성해야 하나?**
A. 아니오. 초기 커밋 `11c3735`에서 이미 골격이 구현되어 있음. 본 플랜은 **검증·보강·테스트·문서화**에 집중.

**Q2. JWT payload가 #72 `AuthRequest` 타입과 호환되는가?**
A. 부분 호환. 현재 payload는 `{ sub: number, email: string|null }` → `JwtStrategy.validate()`가 `User` 엔티티 반환 → `req.user.id`로 접근 가능 (`#72 AuthRequest = { user: { id: number } }`와 일치).
다만 `req.user.id`가 실제로 `User.id`로 흐르는지 통합 검증 필요.

**Q3. `GOOGLE_CALLBACK_URL` env가 `.env.example`에 누락**
A. Phase 2에서 추가. `FRONTEND_URL`도 `auth.controller.ts:64`에서 참조하지만 누락 → 함께 보강.

**Q4. E2E 테스트 어디까지?**
A. Google OAuth는 외부 의존성이 커서 실제 redirect E2E는 제외. **MockStrategy 기반 콜백 동작 검증** 또는 `validateOAuthLogin` 통합 테스트(이미 unit으로 커버)로 충분. 본 플랜은 unit 테스트 범위만 보강.

**Q5. Refresh Token Rotation (#51) 포함?**
A. 제외. `auth.controller.ts:144-151`은 TODO 상태로 별도 이슈(#51) 처리 영역. 본 플랜 범위 밖.

**Q6. 이슈 close vs 보강?**
A. **보강 후 close**. 코드는 있지만 (1) `.env.example` 누락, (2) `google.strategy.ts` 단위 테스트 부재, (3) JWT payload 호환성 명시적 검증 부재 → Phase로 보강하고 PR로 마무리.

### 구현 단계 (Phase)

1. [ ] **Phase 1: GoogleStrategy 단위 테스트 추가**
   - 파일: `apps/api/test/google.strategy.spec.ts` (신규)
   - 구현:
     - `validate()` 호출 시 `done(null, user)` 형태로 OAuth 프로필을 변환하는지 검증
     - `email`/`displayName` 누락 케이스 (`profile.emails === undefined`) → `null` 반환 검증
     - `provider: "google"`, `providerId: profile.id` 매핑 검증
   - 커밋: `test(api): #62 GoogleStrategy validate 단위 테스트 추가`

2. [ ] **Phase 2: 환경변수 문서화 (.env.example 보강)**
   - 파일: `.env.example`
   - 구현:
     - `GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback` 주석 라인 추가
     - `FRONTEND_URL=http://localhost:3000` 주석 라인 추가 (auth.controller.ts에서 사용)
     - 동일 위치에 `KAKAO_CALLBACK_URL`, `NAVER_CALLBACK_URL`도 함께 명시 (일관성)
   - 커밋: `chore(api): #62 OAuth 콜백/프론트엔드 URL 환경변수 문서화`

3. [ ] **Phase 3: JwtStrategy ↔ AuthRequest 타입 호환 검증 테스트**
   - 파일: `apps/api/test/jwt.strategy.spec.ts` (신규)
   - 구현:
     - `JwtStrategy.validate({ sub: 1, email: "x" })` → `AuthService.validateJwtPayload` 호출 검증
     - 반환된 `user`가 `{ id: number, ... }` 형태로 `#72 AuthRequest.user` 구조와 호환 검증
     - 유저 미발견 시 `UnauthorizedException` 검증
   - 커밋: `test(api): #62 JwtStrategy AuthRequest 타입 호환 테스트 추가`

4. [ ] **Phase 4: GoogleStrategy 환경변수 검증 강화 (선택)**
   - 파일: `apps/api/src/auth/google.strategy.ts`
   - 구현:
     - `clientID`/`clientSecret` 빈 문자열일 때 명시적 에러 로그(`Logger.warn`) 추가
     - `auth.module.ts`에서 이미 env 없으면 strategy 등록을 스킵하지만, 이중 안전장치
     - **조건부**: Phase 1~3 완료 후 시간 여유 있을 때만 적용 (스킵 가능)
   - 커밋: `refactor(api): #62 GoogleStrategy 환경변수 누락 시 경고 로그 추가`

### 영향 범위

**파일 변경**
- 신규:
  - `apps/api/test/google.strategy.spec.ts`
  - `apps/api/test/jwt.strategy.spec.ts`
- 수정:
  - `.env.example` (주석 라인 추가만)
  - `apps/api/src/auth/google.strategy.ts` (Phase 4 조건부)

**런타임 동작**: 변경 없음 (테스트와 문서 위주). Phase 4만 로그 출력 추가.

**기존 기능 영향**
- 없음. `auth.module.ts`의 동적 strategy 등록 로직은 그대로 유지 → env 미설정 환경(CI 포함)에서 앱 크래시 없음.
- #72 `NotificationController` 등 `JwtAuthGuard` 사용처: Phase 3 테스트로 회귀 방지.

**의존성**: 추가 없음 (`passport-google-oauth20`, `@types/passport-google-oauth20`, `passport-jwt` 모두 설치됨).

### 테스트 계획

**유닛 테스트 (npm test -w @zipath/api)**
- `auth.service.spec.ts` (기존 8 테스트 통과 유지)
- `google.strategy.spec.ts` (신규, Phase 1)
  - validate가 google 프로필을 OAuthUser로 변환
  - emails/displayName 누락 시 null 매핑
- `jwt.strategy.spec.ts` (신규, Phase 3)
  - validate가 AuthService.validateJwtPayload를 호출
  - 반환된 user가 AuthRequest와 호환되는 형태

**E2E 테스트**: 추가 없음 (외부 OAuth 의존성으로 제외, 사용자 피드백·이슈 범위에서도 미요구)

**수동 검증** (선택)
1. `.env.local`에 `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL` 설정
2. `npm run dev` → `http://localhost:4000/auth/google` 접속
3. Google 로그인 → 프론트 `http://localhost:3000/auth/callback?accessToken=...` 리다이렉트 확인
4. `Authorization: Bearer <accessToken>` 으로 `GET /auth/profile` 200 OK 확인

**커버리지 목표**: `apps/api/src/auth/` 디렉토리 라인 커버리지 ≥ 80% (현재 auth.service만 커버됨 → google.strategy + jwt.strategy 보강).
