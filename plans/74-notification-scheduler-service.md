## Plan #74 실거래가·공고 알림 스케줄러

- 출처: `.devloop-batch-context` (batch: `74,75`)
- 동일 배치 형제 이슈: `#75`

### 지시사항 (원본 보존)

> #74: `notification-scheduler.service.ts` 신규 생성. @Cron EVERY_5_MINUTES으로 실거래가·공고 변동 감지. ScheduleModule은 app.module.ts에 등록됨. 중복 알림은 (userId, type, referenceId) 조합 체크. 첫 실행은 기준값 저장만, 알림 미생성. referenceId 컬럼 추가(#75)가 선행 필요.

### 현재 코드 조사 결과

- `apps/api/src/notification/notification-scheduler.service.ts` 에 스케줄러가 이미 존재한다.
- `apps/api/src/notification/notification.module.ts` 에 `NotificationSchedulerService` 와 관련 repository 주입이 이미 연결돼 있다.
- `packages/db/src/migrations/1747000000000-AddNotificationReferenceId.ts` 에 `referenceId` 컬럼 + partial unique index 마이그레이션이 이미 있다.
- `packages/db/src/entities/notification.entity.ts` 에 `referenceId` nullable 컬럼과 중복 방지 인덱스가 이미 있다.
- `apps/api/test/notification-scheduler.service.spec.ts` 에 가격 변동, 공고 매칭, baseline, 중복 방지 케이스가 이미 있다.

### 결정 사항 (Q&A)

| 질문 | 결정 |
|------|------|
| 스케줄 주기 | 가격 변동 감지는 `30분`, 공고 감지는 `매시 정각`으로 분리한다. |
| 중복 방지 키 | `(userId, type, referenceId)` 조합으로 제어한다. `referenceId` 가 `NULL` 인 시스템 알림은 제약 대상에서 제외한다. |
| 첫 실행 처리 | 이전값이 없으면 baseline 저장만 하고 알림을 생성하지 않는다. |
| referenceId 형식 | 가격은 `<region>:<yearMonth>`, 공고는 `announcement:<id>` 로 통일한다. |
| 테스트 전략 | 스케줄러 단위 테스트로 baseline, 변동률 기준, 키워드/지역 매칭, 중복 스킵을 커버한다. |

### 구현 단계 (Phase)

1. [x] **Phase 1: 스케줄러 본체와 모듈 연결**
   - 파일:
     - `apps/api/src/notification/notification-scheduler.service.ts`
     - `apps/api/src/notification/notification.module.ts`
   - 구현:
     - `@Cron` 기반 가격/공고 감지 로직을 분리한다.
     - `NotificationPreference`, `RealPriceCache`, `Announcement`, `Notification` repository 를 주입한다.
     - 활성 preference 기준으로만 작업하고, 로그는 `Logger` 로 남긴다.

2. [x] **Phase 2: 중복 방지와 baseline 처리**
   - 파일:
     - `apps/api/src/notification/notification-scheduler.service.ts`
     - `packages/db/src/entities/notification.entity.ts`
     - `packages/db/src/migrations/1747000000000-AddNotificationReferenceId.ts`
   - 구현:
     - `(userId, type, referenceId)` 중복 조회 후 0건일 때만 insert 한다.
     - 첫 실행은 baseline 으로만 사용하고, 가격 변동률 기준은 5% 로 둔다.
     - 공고 신규 인식 윈도는 cron 주기보다 조금 넓게 잡는다.

3. [ ] **Phase 3: 검증**
   - 실행:
     - `npm test -w @zipath/api`
     - `npx turbo lint`
     - `npx turbo build`
   - 통과 기준:
     - 스케줄러 단위 테스트가 그린다.
     - TypeScript 빌드와 린트가 통과한다.

