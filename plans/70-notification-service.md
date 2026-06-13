## Plan #70 맞춤 알림 기능 (실거래가 변동 + 청약 공고)

- 플랜식별자: `82136034`
- 출처: GitHub Issue #70 (parent: #57, children: #74 스케줄러 / #75 발송 서비스)

### 지시사항 (원본 보존)

> ## Phase 5 - Task 5.2
> Parent: #57
>
> ## 설명
> 관심 지역의 실거래가 변동 알림과 청약 공고 알림을 제공합니다.
>
> ## 변경 파일
> - `apps/api/src/notification/`
> - `apps/web/app/notifications/`

(child #74 스케줄러 본문)

> 실거래가 및 청약 공고 변동을 감지하여 알림을 생성하는 백엔드 스케줄러.
> NestJS `@Cron` 기반으로 5분 주기 실행.
>
> ### 실거래가 변동 감지
> 1. `NotificationSetting` 에서 관심 지역 목록 조회
> 2. 해당 지역 최신 실거래가 조회 (DB 이전값 vs 현재값 비교)
> 3. 변동 시 `Notification` 엔티티 생성 (타입: `PRICE_CHANGE`)
>
> ### 청약 공고 변동 감지
> 1. 신규 공고 생성 여부 확인 (fetchedAt 기준)
> 2. 관심 지역 매칭 공고 발생 시 `Notification` 엔티티 생성 (타입: `NEW_ANNOUNCEMENT`)
>
> ## 주의사항
> - 중복 알림 방지: `Notification` 테이블에 `(userId, type, referenceId)` unique 제약 또는 생성 전 중복 체크
> - 첫 실행 시 이전값이 없으므로 기준값만 저장하고 알림 생성 스킵

(child #75 발송 서비스 잔여 작업)

> **1. Notification 엔티티 referenceId 컬럼 추가**
> `packages/db/src/entities/notification.entity.ts`
> ```ts
> @Column({ type: 'varchar', nullable: true })
> referenceId!: string | null; // 관련 공고/실거래 ID
> ```
>
> **2. Header.tsx 알림 뱃지**
> - `GET /notifications/unread-count` 30초 폴링
> - count > 0 시 뱃지 표시, 99+ 처리, 0이면 숨김

### 결정 사항 (Q&A)

| 질문 | 결정 |
|------|------|
| 알림 발송 채널 | **앱 내(인앱) 알림 전용**. 이메일/FCM 푸시는 별도 이슈로 분리 (2026-05-05 회의 확정) |
| 알림 타입 문자열 | 기존 컨벤션 유지 — `price_change`, `announcement`, `subscription`, `system` (소문자 스네이크). 이슈 본문의 `PRICE_CHANGE`/`NEW_ANNOUNCEMENT` 는 표기 차이만 있고 의미 동일. `announcement` 로 통일 |
| 중복 알림 방지 전략 | DB unique constraint `UQ_notification_user_type_reference (userId, type, referenceId)` 추가. NULL referenceId 는 system 알림용으로 unique 적용 안 함 (Postgres NULL 동작) |
| 가격 변동 임계치 | `NotificationPreference.priceThresholdMin/Max` 사용 X — 별도 임계값 의미라 기준값 비교가 모호. **이전 평균가 대비 ±5% 이상 변동** 시 알림 생성 (스케줄러 내부 상수 `PRICE_CHANGE_PCT = 0.05`) |
| referenceId 값 형식 | 가격: `regionCode:yearMonth` (예: `11680:202605`) / 공고: `announcement:<announcementId>` (예: `announcement:42`) |
| 공고 매칭 로직 | `NotificationPreference.regions` 에 포함된 지역과 `Announcement.region` 부분 일치(includes) + `announcementKeywords` 가 있으면 `title` 에 키워드 중 하나라도 매칭 |
| 스케줄러 주기 | 실거래가: **30분** (data.go.kr rate-limit 보호, 활성 preference x 지역 수만큼 호출됨). 공고: **매시 정각** (announcement.service 의 매일 06시 sync 와 별도, 신규 저장 감지용) |
| 마이그레이션 | TypeORM 마이그레이션 추가 — `referenceId` 컬럼 + unique index. dev 는 `synchronize: true` 라 자동 반영, prod 는 마이그레이션으로 적용 |
| 헤더 뱃지 위치 | 현재 공통 Header 컴포넌트 없음 (각 페이지 `PageShell` 내부). 신규 `apps/web/src/app/_components/NotificationBell.tsx` 컴포넌트 만들고 추후 PageShell 통합 시 재사용. **이번 플랜에서는** 홈(`app/page.tsx`) 헤더와 알림 페이지(`app/notifications/page.tsx`) 헤더 2 곳에만 우선 적용 |
| 첫 실행(이전값 없음) | 가격: 직전 30분 cache 가 없으면 현재값을 baseline 으로 저장하고 알림 스킵. 공고: `Announcement.createdAt > (lastRun - 70min)` 인 row 만 신규로 인정 |
| 테스트 전략 | 스케줄러: 가짜 repository mock + ConfigService mock → 변동/미변동 케이스 단위 테스트. 컴포넌트: 기존 컨트롤러 spec 패턴 유지, NotificationBell 은 정적 렌더링만 (폴링은 jest fake timer 로 1회 검증) |

### 구현 단계 (Phase)

1. [ ] **Phase 1: Notification 엔티티 — referenceId + 중복 방지 unique index**
   - 파일:
     - `packages/db/src/entities/notification.entity.ts` (수정 — `referenceId varchar nullable` 컬럼 + `@Index(["userId","type","referenceId"], { unique: true, where: "\"referenceId\" IS NOT NULL" })`)
     - `packages/db/src/migrations/<timestamp>-AddNotificationReferenceId.ts` (신규)
   - 구현: 컬럼 추가, partial unique index, 마이그레이션 작성 (Postgres: `CREATE UNIQUE INDEX ... WHERE referenceId IS NOT NULL`).
   - 검증: `npm run build -w @zipath/db` 통과, 기존 jest 그린.
   - 커밋: `feat(db): #70 [P1] Notification referenceId 컬럼 + 중복 방지 unique index`

2. [ ] **Phase 2: 변동 감지 스케줄러 — 가격(30분) + 공고(1시간) (#74)**
   - 파일:
     - `apps/api/src/notification/notification-scheduler.service.ts` (신규)
     - `apps/api/src/notification/notification.module.ts` (수정 — `Provider` 등록, `Announcement`/`RealPriceCache` repo `forFeature` 추가, `RealPriceModule`/`AnnouncementModule` 의존 X — 같은 repo 만 주입)
   - 구현:
     - `@Cron("*/30 * * * *")` `detectPriceChange()`: 활성 `NotificationPreference` 순회 → 각 region/yearMonth 의 `RealPriceCache` 최근 2개 비교 (avgPrice 변동률 ≥ 5%) → 변동 시 `Notification` 생성 (type=`price_change`, referenceId=`<regionCode>:<yearMonth>`). region 문자열 → regionCode 매핑이 없으면 region 명을 그대로 referenceId 일부로 사용 (`regionName:<yearMonth>`).
     - `@Cron("0 * * * *")` `detectNewAnnouncement()`: 최근 70분 내 `createdAt` 된 `Announcement` 조회 → 각 활성 preference 의 regions/keywords 와 매칭되면 `Notification` 생성 (type=`announcement`, referenceId=`announcement:<id>`).
     - 두 메서드 모두 try/catch + Logger, save 전 `(userId,type,referenceId)` 존재 여부 1회 조회로 중복 방지.
   - 테스트: `apps/api/test/notification-scheduler.service.spec.ts` 신규 — repo mock 으로 (a) 변동 5%↑ → 알림 생성, (b) 변동 3% → 알림 미생성, (c) 중복 referenceId 존재 시 skip, (d) 신규 공고 + 지역 매칭 → 알림 생성, (e) 지역 미매칭 → 스킵.
   - 검증: `npm test -w @zipath/api` 그린.
   - 커밋: `feat(api): #70 [P2] 변동 감지 스케줄러 (실거래가 30분 + 공고 1시간) (#74)`

3. [ ] **Phase 3: 인앱 알림 발송 — referenceId DTO 노출 + 헤더 알림 뱃지 (#75)**
   - 파일:
     - `apps/api/src/notification/notification.service.ts` (수정 — `getNotifications` 반환 dto 에 referenceId 포함, 이미 entity 전체 반환이라 자동 노출되지만 명시 주석 + 응답 타입 정리)
     - `apps/web/src/app/_components/NotificationBell.tsx` (신규 — `GET /notifications/unread-count` 30초 폴링, count > 99 → "99+", count === 0 → 숨김, 클릭 시 `/notifications` 이동, `useAuth` 미로그인 상태 시 렌더 X)
     - `apps/web/src/app/page.tsx` (수정 — 헤더 nav 우측에 `<NotificationBell />` 추가)
     - `apps/web/src/app/notifications/page.tsx` (수정 — PageShell 헤더에 `<NotificationBell />` 추가 + notification item 에 referenceId 기반 링크: announcement → `/announcements`, price_change → `/real-price`)
   - 구현: fetchApi 사용, 컴포넌트는 client component, polling cleanup 처리.
   - 테스트: 컨트롤러 spec 은 이미 그린 (변경 없음). NotificationBell 단위 테스트는 별도 web 테스트 인프라 없음 → 수동 검증으로 갈음, 단위 테스트 추가 X.
   - 검증: `npx turbo lint`, `npx turbo build` 그린.
   - 커밋: `feat: #70 [P3] 인앱 알림 헤더 뱃지 + referenceId 링크 (#75)`

### 영향 범위

- **DB**: `notification` 테이블 — `referenceId` 컬럼 신규, partial unique index. 기존 알림 데이터에 referenceId NULL 채워짐 (호환).
- **API**:
  - 신규 모듈 의존성: `NotificationModule` 에 `Announcement`, `RealPriceCache` repository 주입.
  - 신규 `@Cron` 작업 2개 — `ScheduleModule` 은 이미 `app.module.ts` 에 등록되어 추가 작업 없음.
- **Web**: 홈 페이지 + 알림 페이지 헤더에 알림 종 아이콘 추가. 다른 페이지는 영향 없음 (이번 플랜 범위 밖).
- **외부 API 호출량**: 스케줄러는 DB(`RealPriceCache`, `Announcement`) 만 읽음 — data.go.kr 호출 안 함. rate-limit 영향 없음.

### 테스트 계획

- **단위 테스트**:
  - `apps/api/test/notification-scheduler.service.spec.ts` (Phase 2 신규)
    - 가격 변동 ≥ 5% → 알림 1건 생성, type=`price_change`, referenceId 포함
    - 가격 변동 < 5% → 알림 미생성
    - 동일 referenceId 알림 존재 → skip (count 0 증가)
    - 활성 preference 없을 때 → 알림 미생성 + 에러 없음
    - 신규 공고 + 관심 지역 매칭 → 알림 생성
    - 신규 공고 + 키워드 미매칭 → skip
  - 기존 `notification.controller.spec.ts` 변경 없음 (referenceId 는 entity 자동 반환).
- **E2E**: `apps/api/test/e2e/` 에 신규 시나리오 추가 안 함 (스케줄러는 cron 트리거라 E2E 부적합 — 단위 테스트로 커버).
- **Lint/Build**: `npx turbo lint`, `npx turbo build` 모든 패키지 그린.
- **수동 검증**:
  - 로컬 DB 에 `NotificationPreference` (region=`서울 강남구`) 생성 후 스케줄러 메서드 직접 호출 → `Notification` insert 확인
  - 알림 페이지 헤더에 unread count 표시 + 클릭 시 `/notifications` 이동 확인
  - 30 초 폴링 시 새 알림 도착 → 뱃지 숫자 증가
