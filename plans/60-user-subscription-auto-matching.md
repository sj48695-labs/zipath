## Plan #60 사용자 청약 자격-공고 자동 매칭 마무리

- 플랜식별자: `B1093D83`
- 출처: GitHub Issue #60
- 브랜치: `60-user-subscription-auto-matching`
- 회의록: `/tmp/pm-meeting-0fvTPk` 는 현재 워크트리에 없음

### 지시사항 (원본 보존)

#60: 사용자 청약 자격-공고 자동 매칭 마무리. AnnouncementService의 matchAll/matchAnnouncement, DTO, e2e/unit 테스트를 점검하고 기존 TypeORM/PostgreSQL 구조 안에서 누락된 검증만 보강.

### 목표

공고 자동 매칭의 입력 검증과 회귀 테스트를 보강해서, 현재 TypeORM/PostgreSQL 구조를 유지한 채 `matchAllAnnouncements` / `matchAnnouncement` 흐름의 누락된 검증만 채운다.

### 범위

- 수정 범위는 우선 `apps/api` 로 제한한다.
- TypeScript strict 유지, `any` 추가 금지.
- ORM은 TypeORM, DB는 PostgreSQL 전제 유지.
- 기존 `AnnouncementService` 의 매칭 로직은 최대한 유지하고, 누락된 검증과 그에 대한 테스트를 중심으로 보강한다.

### 현재 구조 분석

1. `apps/api/src/announcement/announcement.controller.ts`
   - `POST /announcements/match` 와 `POST /announcements/:id/match` 가 둘 다 `matchRequestSchema.safeParse()` 를 통해 입력을 검증한다.
   - 즉, 실제 검증 계약은 DTO 스키마에 모여 있고 controller 는 얇은 어댑터 역할이다.

2. `apps/api/src/announcement/dto/match-request.dto.ts`
   - `age`, `income`, `homelessMonths` 는 필수이고, `dependents`, `region`, `isMarried`, `isFirstHome` 는 선택 입력이다.
   - 현재 스키마는 기본 범위는 막고 있지만, 경계값/비정상 숫자/빈 문자열 계열의 검증은 더 점검할 여지가 있다.

3. `apps/api/src/announcement/announcement.service.ts`
   - `matchAnnouncement()` 은 공고가 없으면 `null` 을 반환한다.
   - `matchAllAnnouncements()` 는 `endDate >= now` 인 활성 공고만 조회하고, `overallEligible === true` 인 결과만 반환한다.
   - DB 기준이 없을 때는 `applyDefaultCriteria()` 로 fallback 한다.

4. `apps/api/test/announcement.service.spec.ts`
   - `matchAnnouncement()` 의 주요 분기와 `matchAllAnnouncements()` 의 기본 흐름은 이미 많이 커버되어 있다.
   - 다만 DTO 경계값, `matchAll` / `:id/match` 엔드포인트의 400/404 회귀를 더 단단히 고정할 여지가 있다.

5. `apps/api/test/e2e/announcement.e2e-spec.ts`
   - `GET /api/announcements`, `GET /api/announcements/:id`, `POST /api/announcements/match` 일부는 커버되어 있다.
   - `POST /api/announcements/:id/match` 와 invalid payload 에 대한 회귀가 비어 있다.

### 변경 파일

- `apps/api/src/announcement/dto/match-request.dto.ts`
- `apps/api/test/match-request.dto.spec.ts`
- `apps/api/test/announcement.service.spec.ts`
- `apps/api/test/e2e/announcement.e2e-spec.ts`

### Phase별 구현 계획

### Phase 1 (완료): DTO 검증 계약 고정 (커밋 단위)

- 변경 파일: `apps/api/src/announcement/dto/match-request.dto.ts`, `apps/api/test/match-request.dto.spec.ts`
- 구현:
  - `matchRequestSchema` 에서 빠져 있는 입력 검증을 보강한다.
  - `POST /announcements/match` 와 `POST /announcements/:id/match` 가 공유하는 계약이므로, controller 분기가 아니라 DTO 스키마를 기준으로 검증을 고정한다.
  - subscription controller 의 zod 계약과 동일한 스타일을 유지해, 향후 다른 매칭 API 와 검증 철학이 어긋나지 않게 한다.
- 선례 파일:
  - `apps/api/src/subscription/subscription.controller.ts`
  - `apps/api/test/match-request.dto.spec.ts`
- 테스트:
  - 최소 필수 payload 수락
  - optional 필드 포함 payload 수락
  - 경계값/비정상 입력 거부
  - 선택 필드가 비어 있을 때의 동작

### Phase 2 (완료): 매칭 엔드포인트 회귀 검증 (커밋 단위)

- 의존성: Phase 1
- 변경 파일: `apps/api/test/announcement.service.spec.ts`, `apps/api/test/e2e/announcement.e2e-spec.ts`
- 구현:
  - service 단위 테스트에서 `matchAnnouncement()` 의 not-found / `matchAllAnnouncements()` 의 활성 공고 필터 / `matchedCount` 정합성을 다시 고정한다.
  - e2e 에서 `POST /api/announcements/:id/match` 성공, 404, 400 을 추가로 검증한다.
  - `POST /api/announcements/match` 의 invalid payload 도 함께 회귀로 묶어서, DTO 변경이 route 행동을 깨뜨리지 않는지 확인한다.
- 선례 파일:
  - `apps/api/test/e2e/announcement.e2e-spec.ts`
  - `apps/api/test/subscription.service.spec.ts`
  - `apps/api/test/notification-scheduler.service.spec.ts`
- 테스트:
  - `matchAllAnnouncements()` 가 마감 지난 공고를 제외한다.
  - `matchAllAnnouncements()` 가 `matchedCount === matches.length` 를 유지한다.
  - `POST /api/announcements/:id/match` 가 존재하지 않는 공고에 404 를 반환한다.
  - 잘못된 body 는 두 매칭 엔드포인트 모두 400 을 반환한다.
  - `disclaimer` 문구가 유지된다.

### 테스트 계획

1. `npm test -w @zipath/api`
2. `npm run test:e2e -w @zipath/api`
3. 필요 시 `npx turbo lint`

### 완료 기준

- DTO 검증이 매칭 API 양쪽 경로에서 일관되게 동작한다.
- `matchAnnouncement()` 와 `matchAllAnnouncements()` 의 주요 분기와 회귀가 unit/e2e 로 고정된다.
- active-only 필터, 404, 400, disclaimer 가 깨지지 않는다.
- `any` 타입이 추가되지 않는다.
