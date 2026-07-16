## Plan #75 앱 내 알림 발송 서비스

- 출처: `.devloop-batch-context` (batch: `74,75`)
- 동일 배치 형제 이슈: `#74`

### 지시사항 (원본 보존)

> #75: 잔여 2건만 — (1) notification.entity.ts에 referenceId varchar nullable 컬럼 추가, (2) Header.tsx에 /notifications/unread-count 30초 폴링 + 뱃지 렌더링(99+ 처리, 0이면 숨김). Controller/Service는 이미 구현 완료.

### 현재 코드 조사 결과

- `packages/db/src/entities/notification.entity.ts` 에 `referenceId` nullable 컬럼과 partial unique index 가 이미 있다.
- `packages/db/src/migrations/1747000000000-AddNotificationReferenceId.ts` 에 컬럼/인덱스 마이그레이션이 이미 있다.
- `apps/web/src/components/layout/SiteHeader.tsx` 가 공통 헤더를 렌더하고, 그 안에서 `NotificationBell` 을 사용한다.
- `apps/web/src/app/_components/NotificationBell.tsx` 가 `/notifications/unread-count` 를 30초 폴링하고 99+ / 0 처리도 수행한다.
- `apps/api/src/notification/notification.service.ts` 와 `apps/api/src/notification/notification.controller.ts` 는 `getUnreadCount()` 를 이미 노출한다.

### 결정 사항 (Q&A)

| Q | A |
|---|---|
| 헤더 컴포넌트 위치 | 신규 `Header.tsx` 대신, 현재 레포의 공통 헤더인 `apps/web/src/components/layout/SiteHeader.tsx` 에서 알림 뱃지를 렌더한다. |
| 폴링 구현 위치 | 전용 `apps/web/src/app/_components/NotificationBell.tsx` 에서 담당한다. |
| unread count 처리 | `0` 은 숨김, `1~99` 는 숫자 그대로, `100+` 는 `99+` 로 표시한다. |
| 인증 처리 | `useAuth()` 로 미인증 상태는 렌더하지 않고, 인증 시에만 fetch 한다. |
| 수동 검증 | 네트워크 탭으로 30초 폴링과 로그아웃 시 중단을 확인한다. |

### 구현 단계 (Phase)

1. [x] **Phase 1: Notification 엔티티 `referenceId` 컬럼과 마이그레이션**
   - 파일:
     - `packages/db/src/entities/notification.entity.ts`
     - `packages/db/src/migrations/1747000000000-AddNotificationReferenceId.ts`
   - 구현:
     - `referenceId` 를 `varchar nullable` 로 두고, 시스템 알림은 `NULL` 을 허용한다.
     - `(userId, type, referenceId)` partial unique index 로 중복 알림을 막는다.

2. [x] **Phase 2: 헤더 알림 뱃지와 unread-count 폴링**
   - 파일:
     - `apps/web/src/components/layout/SiteHeader.tsx`
     - `apps/web/src/app/_components/NotificationBell.tsx`
   - 구현:
     - 로그인한 사용자만 알림 아이콘을 본다.
     - `GET /notifications/unread-count` 를 30초 주기로 폴링한다.
     - `0` 은 숨기고, `99+` 는 축약한다.

3. [ ] **Phase 3: 검증**
   - 실행:
     - `npm test -w @zipath/api`
     - `npx turbo lint`
     - `npx turbo build`
   - 통과 기준:
     - 백엔드 알림 조회/미읽음 카운트 회귀가 없다.
     - 웹 빌드와 린트가 통과한다.
