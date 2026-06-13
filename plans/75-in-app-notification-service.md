## Plan #75 앱 내 알림 발송 서비스 (잔여 작업: entity 컬럼 + Header 뱃지)

- 플랜식별자: `374799D0`
- 출처: 이슈 #75 + PM 잔여 작업 지시

### 지시사항 (원본 보존)

```
## PM 구현 지침
동일 배치 형제 이슈: #74

#75: 잔여 2건만 — (1) notification.entity.ts에 referenceId varchar nullable 컬럼 추가,
(2) Header.tsx에 /notifications/unread-count 30초 폴링 + 뱃지 렌더링(99+ 처리, 0이면 숨김).
Controller/Service는 이미 구현 완료.
```

원본 이슈 핵심 요구사항:
- `Notification` 엔티티에 `referenceId` 컬럼 추가 (관련 공고/실거래 ID)
- 헤더 알림 아이콘에 unread count 뱃지 (30초 폴링)
- 변경 파일:
  - `packages/db/src/entities/notification.entity.ts`
  - `apps/web/src/components/layout/Header.tsx` (신규)

### 결정 사항 (Q&A)

| Q | A |
|---|---|
| `referenceId` 타입은? | `varchar` + `nullable: true` (공고 ID는 string, 실거래 ID도 string 식별자로 통일 가능, 기존 시스템 알림은 null) |
| 마이그레이션 별도 생성? | 불필요. `InitialBaseline` 이후 prod 배포 전이므로 엔티티만 추가하면 다음 `migration:generate` 시 diff 로 잡힘. (PM 지시 범위 밖이므로 본 플랜은 엔티티만 수정) |
| Header.tsx 위치? | `apps/web/src/components/layout/Header.tsx` (이슈 명시). 기존 components 디렉터리 없음 → 신규 생성 |
| 기존 페이지별 인라인 헤더와의 충돌? | 본 플랜에서는 신규 컴포넌트만 추가. 기존 페이지 헤더 교체는 별도 작업 (스코프 외) |
| 폴링 인터벌 정리? | `useEffect` cleanup 에서 `clearInterval`. 로그아웃/언마운트 시 누수 방지 |
| `0` 처리? | unread === 0 이면 뱃지 미렌더. 미인증 상태에서도 폴링 미실행 |
| `99+` 처리? | unread > 99 이면 `99+` 텍스트 |
| 뱃지 클릭 동작? | 알림 아이콘이 `/notifications` 로 링크 (페이지에서 `history` 탭 진입 흐름 유지) |
| 에러 처리? | fetch 실패 시 silent (콘솔 로그 없이). 다음 폴링 주기에 자동 재시도 |
| API unwrap? | 기존 `fetchApi` 가 `{success, data}` 언랩 처리하므로 그대로 사용 (`/notifications/unread-count` 응답 `number`) |
| Service 응답 타입은? | `notification.service.ts#getUnreadCount` 가 `Promise<number>` 반환 → 프론트에서 `number` 로 받음 |
| 인증 토큰? | `fetchApi(..., { auth: true })`. 미인증 시 ApiError(401) throw → catch 무시 |
| 테스트? | Header.tsx 는 React Testing Library 가 web 프로젝트에 미설정 → 본 플랜에서는 백엔드 entity 단위 테스트만 추가하지 않음 (TypeORM 엔티티 자체는 런타임 검증). 기존 `notification.controller.spec.ts` 회귀만 보장 |

### 구현 단계 (Phase)

1. [ ] **Phase 1: Notification 엔티티 `referenceId` 컬럼 추가**
   - 파일: `packages/db/src/entities/notification.entity.ts`
   - 구현:
     - `@Column({ type: "varchar", nullable: true }) referenceId!: string | null;` 추가
     - `message` 컬럼 아래 위치 (논리적 그룹: type / title / message / referenceId / readAt)
     - 주석: `// 관련 공고/실거래 ID (시스템 알림은 null)`
   - 검증:
     - `npm test -w @zipath/api` — 기존 회귀 없음 확인
     - `npx turbo build` — TypeScript 빌드 통과
   - 커밋: `feat(db): #75 Notification.referenceId 컬럼 추가`

2. [ ] **Phase 2: Header 컴포넌트 신규 작성 + unread-count 30초 폴링**
   - 파일: `apps/web/src/components/layout/Header.tsx` (신규)
   - 구현:
     - `"use client"` directive
     - 로고 (`Zipath` → `/`), 네비게이션 (`/subscription`, `/real-price`, `/notifications`), 알림 아이콘 (`/notifications` Link)
     - `useAuth` 로 `isAuthenticated` 확인
     - `useState<number>(0)` unread count
     - `useEffect`:
       - 미인증 → 폴링 미실행 + 카운트 0 리셋
       - 인증 시 즉시 1회 fetch + `setInterval(..., 30_000)`
       - cleanup: `clearInterval`
     - fetch 함수: `fetchApi<number>("/notifications/unread-count", { auth: true })` → catch 무시
     - 뱃지 렌더:
       - `unread === 0` → 미렌더
       - `unread > 99` → `99+`
       - else → `unread` 그대로
       - 위치: 알림 아이콘 우상단 (absolute), 빨간 원형 (`bg-red-500 text-white text-xs rounded-full`)
     - 알림 SVG 아이콘 (bell shape)
     - 법적 고지: 본 컴포넌트는 헤더이므로 별도 고지 불필요
   - 검증:
     - `npx turbo lint --filter=@zipath/web` — lint 통과
     - `npx turbo build --filter=@zipath/web` — 빌드 통과
   - 커밋: `feat(web): #75 Header 알림 뱃지 + unread-count 30초 폴링`

### 영향 범위

- **backend (db)**:
  - `packages/db/src/entities/notification.entity.ts` — `referenceId` 컬럼 1개 추가
  - 기존 데이터: 신규 컬럼이 nullable 이므로 기존 행에는 NULL. 마이그레이션은 차기 generate 시 자동 포함
- **frontend**:
  - `apps/web/src/components/layout/Header.tsx` — 신규 파일
  - 본 플랜에서는 기존 페이지 (`page.tsx`, `notifications/page.tsx` 등) 의 인라인 헤더는 그대로 둠 (호환성 유지). 다른 페이지에서 Header 컴포넌트 채택 여부는 후속 PR
- **API**: 변경 없음 (`NotificationController#getUnreadCount` 기존 endpoint 그대로 사용)

### 테스트 계획

| 항목 | 방법 | 통과 기준 |
|------|------|-----------|
| 엔티티 회귀 | `npm test -w @zipath/api` | `notification.controller.spec.ts` 11개 케이스 모두 PASS |
| 타입 안전성 | `npx turbo build` | 전체 패키지 TypeScript 빌드 통과 (db, api, web) |
| Lint | `npx turbo lint` | ESLint 0 에러 |
| Header 렌더 (수동) | `npm run dev` → `/` 접근 | 로고/네비/알림 아이콘 표시. 로그인 후 미읽음 0 이면 뱃지 미표시, 1개 발생 시 숫자 뱃지 표시 |
| 폴링 (수동) | DevTools Network 탭 | 로그인 상태에서 30초 간격으로 `/notifications/unread-count` 호출 확인. 로그아웃 시 호출 중단 |
| 99+ (수동) | 알림 100개 더미 생성 후 페이지 새로고침 | 뱃지 텍스트 `99+` 표시 |
| 미인증 (수동) | 로그아웃 후 새로고침 | unread fetch 호출 없음 (네트워크 탭 확인). 뱃지 미표시 |
