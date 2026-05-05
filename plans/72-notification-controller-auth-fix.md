## Plan #72 NotificationController 인증 취약점 수정

- 플랜식별자: `1446FFDF`
- 출처: GitHub Issue #72 (https://github.com/sj48695-labs/zipath/issues/72)

### 지시사항 (원본 보존)

> ## PM 구현 지침
> #72: NotificationController 인증 취약점 수정. @UseGuards(JwtAuthGuard) 적용 후 @Param('userId') 제거, req.user.id로 교체. notification.controller.ts + web notifications/page.tsx TEMP_USER_ID 제거(AuthContext 연동). 다른 auth 엔드포인트(예: auth.controller.ts)의 JwtAuthGuard 적용 방식 참고.

이슈 본문 핵심:
- `NotificationController`가 `userId`를 URL 파라미터/Body로 직접 받아 JWT 인증 없이 타 사용자 데이터 접근 가능 (`GET /notifications/1`, `GET /notifications/unread-count/1` 등 무인증 열람 가능).
- 수정 방향
  1. `NotificationController` 전체에 `@UseGuards(JwtAuthGuard)` 적용
  2. `userId` 파라미터 제거 → `@Req() req`에서 `req.user.id` 추출
  3. `PUT /:id/read` Body의 `userId` 제거, JWT에서 추출
  4. `apps/web/src/app/notifications/page.tsx`의 `TEMP_USER_ID = 1` 제거, AuthContext에서 userId 추출

### 결정 사항 (Q&A)

- **Q1. JwtAuthGuard 적용 단위는?** → `auth.controller.ts`는 메서드 단위로 `@UseGuards(JwtAuthGuard)`를 사용하지만, NotificationController는 이슈 본문대로 컨트롤러 전체에 클래스 레벨로 `@UseGuards(JwtAuthGuard)`를 적용한다. 모든 엔드포인트가 인증 사용자 본인 데이터 한정이기 때문.
- **Q2. Request 타입 정의는?** → `auth.controller.ts:156`의 `@Request() req: { user: { id: number } }` 패턴을 그대로 사용. `JwtStrategy.validate()`가 `User` 엔티티를 반환하므로 `req.user.id: number` 접근 가능. 별도 `AuthRequest` 타입 추가는 하지 않음(단일 컨트롤러라 over-engineering).
- **Q3. URL 라우트는 어떻게 변경?** → 아래와 같이 `userId` 제거 후 의미 기반 경로로 단순화:
  - `GET /notifications/preferences/:userId` → `GET /notifications/preferences` (req.user.id)
  - `POST /notifications/preferences` Body의 `userId` 필드 제거, req.user.id 사용
  - `PUT /notifications/preferences/:id` 유지 (preference id는 사용자별 고유, service에서 소유권 검증 추가)
  - `DELETE /notifications/preferences/:id` 유지 (위와 동일, 소유권 검증 추가)
  - `GET /notifications/:userId` → `GET /notifications` (req.user.id)
  - `PUT /notifications/:id/read` Body의 userId 제거, req.user.id 사용 (이미 service에서 `where: { id, userId }`로 소유권 검증 중)
  - `PUT /notifications/read-all/:userId` → `PUT /notifications/read-all` (req.user.id)
  - `GET /notifications/unread-count/:userId` → `GET /notifications/unread-count` (req.user.id)
- **Q4. updatePreference / deletePreference 소유권 검증?** → service의 `findOne({ where: { id } })`에 `userId`도 포함시켜 본인 preference만 수정/삭제 가능하도록 강화. (현재는 id만으로 접근 가능)
- **Q5. 프론트에서 JWT 토큰 전달 방법?** → `apps/web/src/lib/api.ts`의 `fetchApi`가 현재 Authorization 헤더를 자동 첨부하지 않음. AuthContext의 `localStorage.getItem("accessToken")`을 읽어 헤더에 첨부하도록 `fetchApi`에 옵션 추가. notifications 페이지에서만 사용. (전역 변경은 범위 외이므로 호출부에서 토큰 주입)
- **Q6. 비로그인 사용자 처리?** → `profile/page.tsx`(`apps/web/src/app/profile/page.tsx:66`) 패턴을 따라 `isAuthenticated`가 false면 "로그인이 필요합니다" 안내 화면 표시. 자동 리다이렉트는 하지 않음.
- **Q7. 테스트 추가?** → 현재 `apps/api/test/`에 notification 관련 테스트가 없음. 본 PR에서는 보안 픽스에 집중하고, controller-level guard 동작을 검증하는 unit test 1개를 새로 추가(`notification.controller.spec.ts`). E2E는 기존에 없으므로 범위 외.
- **Q8. 마이그레이션 영향?** → URL 변경은 클라이언트만 사용하는 내부 API라 외부 영향 없음. DB 스키마 변경 없음.

### 구현 단계 (Phase)

1. [x] **Phase 1: 백엔드 NotificationController 인증 가드 적용 + URL 정리**
   - 파일: `apps/api/src/notification/notification.controller.ts`
   - 구현:
     - 클래스 레벨 `@UseGuards(JwtAuthGuard)` 적용
     - 모든 엔드포인트에서 `:userId` 경로/`userId` body 파라미터 제거, `@Request() req: { user: { id: number } }`에서 추출
     - `CreatePreferenceBody`의 `userId` 필드 제거
     - `markAsRead`의 Body `userId` 제거
   - 커밋: `fix(api): NotificationController에 JwtAuthGuard 적용 및 userId 파라미터 제거`

2. [x] **Phase 2: NotificationService preference 소유권 검증 강화**
   - 파일: `apps/api/src/notification/notification.service.ts`
   - 구현:
     - `updatePreference(id, userId, dto)`, `deletePreference(id, userId)` 시그니처 변경 → `findOne({ where: { id, userId } })` 사용해 본인 preference만 수정/삭제
     - `createPreference(userId, dto)` 시그니처 변경 (userId를 dto에서 분리)
     - 컨트롤러 호출부도 함께 갱신 (Phase 1 파일과 함께 한 커밋에 묶을지 분리할지: Phase 1과 Phase 2는 의존적이므로 통합 가능하나, 가독성 위해 분리. service 시그니처 변경이 controller보다 나중에 오면 컴파일 안 되므로 **Phase 1과 Phase 2를 한 커밋으로 묶는다**.)
   - 커밋: Phase 1과 합쳐 단일 커밋 (위 메시지에 "+ service 소유권 검증 강화" 추가)

   > 참고: Phase 1 + Phase 2는 빌드 의존성으로 묶이므로 실제 커밋은 1개. 리뷰 단위는 동일 디렉터리 + 동일 보안 fix scope.

3. [x] **Phase 3: 프론트 notifications 페이지 AuthContext 연동**
   - 파일: `apps/web/src/app/notifications/page.tsx`, `apps/web/src/lib/api.ts`
   - 구현:
     - `apps/web/src/lib/api.ts`의 `fetchApi`에 `auth?: boolean` 옵션 추가, true면 `localStorage.getItem("accessToken")`을 `Authorization: Bearer ...`로 첨부. 토큰 부재 시 throw.
     - `notifications/page.tsx`에서 `TEMP_USER_ID` 상수 제거
     - `useAuth()` 훅 사용해 `isAuthenticated`, `user`, `isLoading` 가져옴
     - 비로그인 시 `profile/page.tsx`와 동일한 "로그인이 필요합니다" 안내 화면 렌더
     - 모든 `fetchApi` 호출에서 URL의 `${TEMP_USER_ID}` 부분 제거 + `auth: true` 옵션 전달
     - savePreference body에서 `userId` 필드 제거
     - markAsRead body에서 `userId` 필드 제거
   - 커밋: `fix(web): notifications 페이지를 AuthContext와 연동하고 TEMP_USER_ID 제거`

4. [x] **Phase 4: NotificationController 단위 테스트 추가**
   - 파일: `apps/api/test/notification.controller.spec.ts` (신규)
   - 구현:
     - NotificationService를 모킹한 controller spec
     - `@Request() req`로 주입된 `req.user.id`가 service 메서드에 정확히 전달되는지 검증
     - 핵심 케이스: `getNotifications`, `markAsRead`, `getUnreadCount`, `getPreference` 4개에서 `req.user.id`가 service에 그대로 전달되는지 확인
   - 커밋: `test(api): NotificationController 인증 컨텍스트 전달 검증 테스트 추가`

### 영향 범위

**백엔드 변경**
- `apps/api/src/notification/notification.controller.ts` (전체 재작성 수준)
- `apps/api/src/notification/notification.service.ts` (preference 메서드 시그니처 변경)
- `apps/api/test/notification.controller.spec.ts` (신규)

**프론트 변경**
- `apps/web/src/app/notifications/page.tsx` (AuthContext 연동, TEMP_USER_ID 제거)
- `apps/web/src/lib/api.ts` (auth 옵션 추가)

**API 변경 (Breaking)**
| Before | After |
|--------|-------|
| `GET /notifications/preferences/:userId` | `GET /notifications/preferences` (JWT) |
| `POST /notifications/preferences` (body.userId) | `POST /notifications/preferences` (JWT, body.userId 제거) |
| `GET /notifications/:userId` | `GET /notifications` (JWT) |
| `PUT /notifications/:id/read` (body.userId) | `PUT /notifications/:id/read` (JWT) |
| `PUT /notifications/read-all/:userId` | `PUT /notifications/read-all` (JWT) |
| `GET /notifications/unread-count/:userId` | `GET /notifications/unread-count` (JWT) |

DB 스키마 변경 없음. 외부 API 영향 없음(내부 클라이언트 전용).

### 테스트 계획

**자동 테스트**
- 신규: `apps/api/test/notification.controller.spec.ts`
  - `getNotifications`가 `req.user.id`를 그대로 service에 전달
  - `markAsRead`가 `req.user.id`를 그대로 service에 전달
  - `getUnreadCount`가 `req.user.id`를 그대로 service에 전달
  - `getPreference`가 `req.user.id`를 그대로 service에 전달
- 기존: `npm test -w @zipath/api` 통과 확인 (auth.service.spec.ts 등 회귀 없음)
- 린트: `npx turbo lint` 통과 확인
- 빌드: `npx turbo build` 통과 확인

**수동 검증** (CI 외)
1. `npm run dev`로 로컬 띄움
2. 비로그인 상태에서 `/notifications` 접속 → "로그인이 필요합니다" 화면
3. `curl http://localhost:4000/api/notifications/1` → `401 Unauthorized` (이전에는 200)
4. OAuth 로그인 후 `/notifications` 진입 → 본인 데이터만 정상 로드
5. 다른 사용자 토큰으로 본인 preference만 update/delete 가능한지 확인 (소유권 검증)
