## Plan #74 변동 감지 스케줄러 (실거래가·청약 공고)

- 플랜식별자: `117AC081`
- 출처: GitHub Issue #74 (https://github.com/sj48695-labs/zipath/issues/74)

### 지시사항 (원본 보존)

> ## PM 구현 지침
> 동일 배치 형제 이슈: #75
>
> #74: notification-scheduler.service.ts 신규 생성. @Cron EVERY_5_MINUTES으로 실거래가·공고 변동 감지. ScheduleModule은 app.module.ts에 등록됨. 중복 알림은 (userId, type, referenceId) 조합 체크. 첫 실행은 기준값 저장만, 알림 미생성. referenceId 컬럼 추가(#75)가 선행 필요.

이슈 본문 핵심:
- 실거래가 변동 감지: `NotificationPreference`에서 관심 지역 → 최신 실거래가(DB 이전값 vs 현재값) 비교 → 변동 시 `Notification`(type=`PRICE_CHANGE`) 생성.
- 청약 공고 변동 감지: 신규 공고(`fetchedAt` 기준) 발생 시 관심 지역 매칭하여 `Notification`(type=`NEW_ANNOUNCEMENT`) 생성.
- 변경 파일: `notification-scheduler.service.ts` (신규), `notification.module.ts` (ScheduleModule 등록 — 이미 `app.module.ts`에 전역 등록되어 있어 `forFeature(...)`만 보강).
- 주의: 중복 알림 방지(`userId, type, referenceId` 조합), 첫 실행 시 기준값만 저장(알림 스킵).

### 결정 사항 (Q&A)

- **Q1. `referenceId` 컬럼이 아직 없는데 #74 단독 머지 가능한가?** → PM 지침이 "선행 필요"라 명시하므로 본 PR에서 `Notification.referenceId` 컬럼 추가도 함께 처리한다. #75가 추가하려는 `type` (현재 string), `referenceId`, `message`(이미 있음) 중 referenceId만 본 PR에 포함하여 스케줄러가 동작할 수 있는 최소 스키마를 갖춘다. (#75에서 type enum 정형화는 별도)
- **Q2. `Notification.type` 값은 어떻게 통일?** → 현재 엔티티 주석은 소문자(`'announcement' | 'price_change' | 'subscription' | 'system'`)이지만 이슈 본문은 대문자(`PRICE_CHANGE` / `NEW_ANNOUNCEMENT`)를 사용. 이슈 본문을 정본으로 보고 대문자 SNAKE_CASE 상수로 통일(`PRICE_CHANGE`, `NEW_ANNOUNCEMENT`). 기존 주석은 갱신.
- **Q3. 실거래가 변동 "이전값"은 어디에 저장?** → `RealPriceCache`(현재 `regionCode/dealType/yearMonth` unique)는 raw API 결과 캐시일 뿐 "기준선"이 아니다. 스케줄러 전용 별도 상태가 필요. 신규 엔티티 `PriceBaseline`(`regionCode`, `dealType`, `yearMonth`, `avgPrice`, `tradeCount`, `updatedAt`)을 추가하여 직전 평균가를 저장하고 매 사이클마다 비교 후 갱신한다. (referenceId는 `${regionCode}:${yearMonth}` 사용)
- **Q4. 신규 공고 기준 `fetchedAt`은?** → `Announcement` 엔티티엔 `fetchedAt`이 없고 `createdAt` 만 존재. `createdAt > lastRunAt` 으로 신규 판별하고 마지막 실행 시각은 메모리(서비스 인스턴스 필드)로 관리(콜드 스타트 시 첫 실행은 기준값 저장만). 영속 보장이 필요한 경우 후속 PR에서 별도 상태 테이블로 확장.
- **Q5. 관심 지역 매칭 로직?** → `NotificationPreference.regions`는 "서울 강남구" 형식, `Announcement.region`은 API 제공 값(예: "서울특별시 강남구"). 부분 문자열 매칭(`announcement.region.includes(preferenceRegion)` 또는 역방향)으로 처리. 정밀 매칭은 후속 개선 과제로 남긴다.
- **Q6. 가격 변동 임계치?** → `NotificationPreference.priceThresholdMin/Max`는 가격 필터(관심 가격대)이지 "변동 임계치"가 아니다. 스케줄러 자체 임계치는 코드 상수 `PRICE_CHANGE_THRESHOLD_PCT = 3`(±3%)로 두고, 평균가 변동률이 임계치 이상이면 알림. 사용자별 임계치 필드 추가는 범위 외.
- **Q7. `@Cron` 표현식?** → `@nestjs/schedule`의 `CronExpression.EVERY_5_MINUTES`(`"0 */5 * * * *"`)를 사용. 운영에서 부하 우려 시 환경변수로 끄거나 주기 조정. (본 PR은 기본값만)
- **Q8. 중복 알림 unique 제약을 DB로 거는가?** → DB unique 제약은 #75 진행 시 함께 결정. 본 PR은 마이그레이션 회피를 위해 **컬럼만 추가**(nullable)하고, 스케줄러 내부에서 `findOne({ where: { userId, type, referenceId } })`로 중복 체크. unique index는 후속.
- **Q9. ScheduleModule 등록 추가 필요?** → `app.module.ts:50`에 `ScheduleModule.forRoot()` 이미 등록됨. `notification.module.ts`는 변경 불필요(단, 신규 서비스를 `providers`에 추가하고 `PriceBaseline` Repository를 `forFeature`에 추가).
- **Q10. 실거래가 데이터는 어떻게 가져오는가?** → `RealPriceService.search(regionCode, yearMonth)`를 그대로 호출(캐시 우선). 스케줄러는 지역코드를 "서울 강남구" → LAWD_CD 5자리로 변환할 필요가 있는데, 본 PR은 단순화를 위해 `NotificationPreference.regions`에 `이름:LAWD_CD` 형식 또는 LAWD_CD 자체가 들어있다고 가정하지 않고, **별도 매핑 테이블/하드코딩** 없이 LAWD_CD 5자리 숫자 정규식(`/^\d{5}$/`)을 통과하는 항목만 실거래가 비교 대상으로 처리. 그 외(이름 문자열)는 공고 매칭에만 사용. (지역 매핑은 #70 트리의 별도 이슈로 정리)
- **Q11. 테스트 범위?** → `notification-scheduler.service.spec.ts` 단위 테스트로 (1) 첫 실행 기준값만 저장, (2) 변동 시 알림 생성, (3) 중복 알림 스킵, (4) 신규 공고 매칭 케이스를 mock repository 기반으로 검증. `cleanup.service.spec.ts` 패턴을 그대로 따른다. E2E는 범위 외.
- **Q12. `simple-array` 와 `regions` 비교 빈 배열 케이스?** → `NotificationPreference.regions`가 빈 배열인 경우 해당 사용자는 스킵. `isActive=false`도 스킵. `findBy({ isActive: true })`로 1차 필터.

### 구현 단계 (Phase)

1. [ ] **Phase 1: Notification 엔티티에 `referenceId` 추가 + PriceBaseline 엔티티 신설**
   - 파일:
     - `packages/db/src/entities/notification.entity.ts` (referenceId 컬럼 추가, type 주석 갱신)
     - `packages/db/src/entities/price-baseline.entity.ts` (신규)
     - `packages/db/src/index.ts` (PriceBaseline export)
   - 구현:
     - `Notification`에 `@Column({ type: 'varchar', nullable: true }) referenceId!: string | null;` 추가
     - 주석 갱신: `type: 'PRICE_CHANGE' | 'NEW_ANNOUNCEMENT' | ...`
     - `PriceBaseline` 엔티티: `id`, `regionCode`(varchar), `dealType`(varchar), `yearMonth`(varchar), `avgPrice`(bigint), `tradeCount`(int), `@UpdateDateColumn updatedAt` + `@Unique(["regionCode", "dealType", "yearMonth"])`
     - `index.ts`에 export 추가
   - 커밋: `feat(db): #74 Notification.referenceId 컬럼 추가 + PriceBaseline 엔티티 신설`

2. [ ] **Phase 2: NotificationSchedulerService 구현 (실거래가 + 공고 변동 감지)**
   - 파일:
     - `apps/api/src/notification/notification-scheduler.service.ts` (신규)
     - `apps/api/src/notification/notification.module.ts` (Repository forFeature + providers 추가)
   - 구현:
     - `@Injectable()` + `@Cron(CronExpression.EVERY_5_MINUTES)` 진입점 `handleChangeDetection()`
     - 의존성: `NotificationPreference`, `Notification`, `PriceBaseline`, `Announcement` Repository + `RealPriceService` (RealPriceModule export 필요 시 함께 처리)
     - `detectPriceChanges()`: 활성 preference의 LAWD_CD 5자리 region에 대해 `RealPriceService.search` → 평균가 계산 → `PriceBaseline` 조회 → 첫 기록이면 baseline 저장만, 아니면 ±3% 이상 변동 시 `Notification` 생성 후 baseline 갱신. referenceId = `${regionCode}:${yearMonth}`. 중복 체크 `findOne({ userId, type:'PRICE_CHANGE', referenceId })`.
     - `detectNewAnnouncements()`: `lastAnnouncementCheckAt` 메모리 필드 기반으로 `createdAt > lastAnnouncementCheckAt` 신규 공고 조회 → preference.regions 부분 매칭 → 매칭 사용자별 `Notification`(type=`NEW_ANNOUNCEMENT`, referenceId=`announcement:${id}`) 생성. 첫 실행(`lastAnnouncementCheckAt === null`)은 시각만 기록하고 알림 스킵.
     - 로깅: `CleanupService` 스타일 (`logger.log`로 시작/완료 + 건수)
     - `notification.module.ts`: `TypeOrmModule.forFeature([..., PriceBaseline, Announcement])`, `imports: [RealPriceModule]`, `providers`에 `NotificationSchedulerService` 추가
   - 커밋: `feat(api): #74 실거래가·청약 공고 변동 감지 스케줄러 구현`

3. [ ] **Phase 3: NotificationSchedulerService 단위 테스트**
   - 파일: `apps/api/src/notification/notification-scheduler.service.spec.ts` (신규)
   - 구현 (`cleanup.service.spec.ts` 패턴):
     - mock repositories (`NotificationPreference`, `Notification`, `PriceBaseline`, `Announcement`) + mock `RealPriceService`
     - 케이스
       1. `detectPriceChanges` — 첫 실행 시 baseline만 저장하고 알림 생성 X
       2. `detectPriceChanges` — baseline 대비 +5% 변동 시 알림 1건 생성 + baseline 갱신
       3. `detectPriceChanges` — 변동 발생했지만 동일 referenceId 알림이 이미 있으면 스킵
       4. `detectNewAnnouncements` — `lastAnnouncementCheckAt` null 인 첫 실행 → 시각만 기록, 알림 0
       5. `detectNewAnnouncements` — 관심 지역(`서울 강남구`) 매칭 공고 1건 신규 → 사용자에게 알림 1건 생성
       6. `handleChangeDetection` — 두 메서드를 순차 호출
   - 커밋: `test(api): #74 변동 감지 스케줄러 단위 테스트 추가`

### 영향 범위

- **백엔드(`apps/api`)**: notification 모듈에 스케줄러 서비스 신설. `RealPriceModule` export 필요할 수 있음(현재 미확인 시 Phase 2에서 함께 export).
- **DB(`packages/db`)**: 엔티티 2건 변경(`Notification` 컬럼 추가, `PriceBaseline` 신규). 개발 환경은 `synchronize: true`로 자동 반영, 프로덕션은 `migrationsRun: true`로 베이스라인 이후 diff 마이그레이션 필요 → 본 PR에선 엔티티만 추가하고 마이그레이션 파일은 후속 PR(또는 #75 머지 시 일괄)에 위임. (배포 시 `npm run migration:generate` 별도 수행)
- **프론트엔드(`apps/web`)**: 변경 없음 (#75에서 UI 추가).
- **공공 API**: 추가 호출은 `RealPriceService.search` 기존 캐시 경유. 캐시 hit 시 외부 호출 없음. 5분 주기지만 캐시로 인해 일자별 1회 수준.

### 테스트 계획

- **로컬 유닛 테스트**: `npm test -w @zipath/api` — 신규 `notification-scheduler.service.spec.ts` 6 케이스 모두 통과.
- **수동 검증(선택)**: `npm run dev` + 활성 NotificationPreference + 임의로 PriceBaseline 평균가를 낮춰 임계치 초과 변동 발생 → 5분 내 `Notification` row 1건 생성 확인.
- **회귀**: 기존 `cleanup.service.spec.ts`, `notification.service.spec.ts`(있다면) 영향 없음. lint/build 통과(`npx turbo lint && npx turbo build`).
- **CI**: PR → `develop` 타겟. lint + build + unit test pass 필요. `auto-merge` 라벨 부여 시 자동 머지.
