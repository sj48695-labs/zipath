## Plan #59 공고 데이터 DB 저장 + fetchedAt 캐싱

- 플랜식별자: `C26E24CA`
- 출처: GitHub Issue #59 (Phase 1 - Task 1.2, Parent #53)
- 브랜치: `59-announcement-db-caching` → target `develop`

### 지시사항 (원본 보존)

> #59: Announcement 엔티티에 DB 저장 + fetchedAt 기반 캐싱 구현. LH API 응답을 upsert로 저장, 3개월 초과 데이터는 cleanup.service와 동일 패턴으로 정리. 파일: announcement.service.ts, announcement.entity.ts

이슈 본문 요약:
- TypeORM Announcement 엔티티 정의
- fetchedAt 기반 캐싱 (3개월 정리 정책 적용)
- 변경 파일: `packages/db/src/entities/announcement.entity.ts`, `apps/api/src/announcement/announcement.service.ts`

### 결정 사항 (Q&A)

**Q1. 현재 코드 상태 — 무엇이 비어 있는가?**
- 엔티티: `Announcement` 는 존재하지만 `fetchedAt` 필드가 **없다** (createdAt/updatedAt 만 존재).
- 서비스: `syncFromApi()` 가 `findOne` 후 `save` 하는 수동 dedup 패턴이며, **PK 가 아닌 임의의 `organization = HOUSE_MANAGE_NO-PBLANC_NO` 합성 키**를 사용 — TypeORM `upsert` 미사용, race condition 가능.
- cleanup: `cleanOldAnnouncements()` 는 `endDate` 기준 6개월 삭제만 수행. 이슈가 명시한 "3개월 초과 fetchedAt" 정책과 불일치.
- 마지막 커밋 `0b241db (feat(api): #59 …)` 은 **빈 커밋**이라 추가 작업 필요.

**Q2. 자연 키로 무엇을 쓸까?**
LH/data.go.kr 공공분양 API는 `PBLANC_NO` (공고 일련번호) 가 사실상 유일 식별자. `HOUSE_MANAGE_NO` 와 결합해 `externalId` (varchar) 로 명시적으로 분리하고 **UNIQUE 제약**을 건다. 합성 키를 `organization` 컬럼에 우겨넣던 기존 hack 을 제거.

**Q3. fetchedAt 의미는?**
- 한 공고 row 가 API 응답으로부터 마지막에 갱신된 시각.
- `upsert` 시 매번 `new Date()` 로 갱신 → 3개월간 응답에 안 잡힌 공고는 stale 로 간주 후 cleanup.
- `endDate` 기준(마감 6개월) 정책은 별개 — 이슈 지시대로 **fetchedAt 3개월**을 신규 추가하고, 기존 endDate 6개월 정책도 그대로 유지(겹쳐도 안전, OR 조건 효과).

**Q4. upsert 패턴은?**
TypeORM 의 `Repository.upsert(entities, { conflictPaths: ["externalId"], skipUpdateIfNoValuesChanged: true })` 사용. 배치(N=50) 호출. `fetchedAt` 은 entity 빌드 시점에 `new Date()` 로 명시 세팅 (Postgres 의 `now()` default 가 conflict 갱신 시 자동 갱신되지 않으므로).

**Q5. 마이그레이션은 어떻게?**
- 베이스라인은 1개만 존재 (`1746489600000-InitialBaseline.ts`, synchronize 사용).
- 신규 컬럼/UNIQUE 추가 → `npm run migration:generate` 로 diff 마이그레이션 신규 생성. 파일명 timestamp 는 generate 가 자동 부여.
- Render 운영 DB 에는 `npm run migration:run` 으로 적용 (배포 hook 은 기존 흐름 그대로).

**Q6. 테스트는?**
- `AnnouncementService` 신규 `*.spec.ts` 작성 (현재 없음).
- 핵심 시나리오: ① upsert 호출 인자 검증, ② fetchedAt 세팅 검증, ③ XML 에러 응답 시 upsert 미호출, ④ items 비었을 때 경고 로그.
- `CleanupService.spec.ts` 에 fetchedAt 3개월 케이스 추가 (기존 endDate 6개월 테스트는 유지).

**Q7. 기존 데이터 마이그레이션은?**
신규 컬럼 `externalId`, `fetchedAt` 은 NULL 허용으로 추가한 뒤 backfill — 기존 `organization` 합성키를 `externalId` 로 복사, `fetchedAt = createdAt` 으로 초기화. 그다음 NOT NULL + UNIQUE 제약. 단일 마이그레이션 내 raw SQL 로 처리.

### 구현 단계 (Phase)

1. [ ] **Phase 1: 엔티티 확장 — fetchedAt + externalId + UNIQUE**
   - 파일: `packages/db/src/entities/announcement.entity.ts`
   - 변경:
     - `externalId: string` (varchar, NOT NULL, UNIQUE) — `HOUSE_MANAGE_NO-PBLANC_NO` 저장 전용 컬럼.
     - `fetchedAt: Date` (timestamp, NOT NULL, default now()) — 마지막 동기화 시각.
     - `@Index()` / `@Unique(["externalId"])` 추가.
   - 마이그레이션 생성: `npm run migration:generate -w @zipath/db -- src/migrations/AnnouncementFetchedAt`
     - 컬럼 추가 → `UPDATE announcement SET external_id = organization, fetched_at = created_at` backfill → NOT NULL/UNIQUE 제약.
   - 커밋: `feat(db): #59 [P1] Announcement.fetchedAt + externalId UNIQUE 컬럼 추가`

2. [ ] **Phase 2: 서비스 upsert 전환 + fetchedAt 세팅**
   - 파일: `apps/api/src/announcement/announcement.service.ts`
   - 변경:
     - 기존 `findOne → save` 루프를 제거하고 `announcementRepo.upsert(items, { conflictPaths: ["externalId"] })` 단일 호출로 교체 (배치 1회).
     - 각 entity 빌드 시 `externalId: ${HOUSE_MANAGE_NO}-${PBLANC_NO}`, `fetchedAt: new Date()` 명시.
     - `organization` 은 본래 의미("LH"/"SH" 발행기관)로 복원 — 현재 임시로 `HOUSE_MANAGE_NO-PBLANC_NO` 가 들어가던 hack 제거 (`organization = "LH"` 등 적절히 추정 매핑 또는 API 필드 사용).
     - 로그: `upsert ${items.length}건 (신규+갱신)` 형태로 정정.
   - 커밋: `feat(api): #59 [P2] LH 공고 upsert + fetchedAt 갱신`

3. [ ] **Phase 3: cleanup 3개월 fetchedAt 정책 추가**
   - 파일: `apps/api/src/cleanup/cleanup.service.ts`, `apps/api/src/cleanup/cleanup.service.spec.ts`
   - 변경:
     - 신규 메서드 `cleanStaleAnnouncements()` — `fetchedAt < threeMonthsAgo` 인 row 삭제 (기존 `cleanOldAnnouncements` 의 endDate 6개월 정책은 유지).
     - `handleCleanup()` 에 새 메서드 호출 추가.
     - spec: `cleanStaleAnnouncements` 가 `fetchedAt` 키로 `delete` 호출하는지 검증.
   - 커밋: `feat(api): #59 [P3] fetchedAt 3개월 초과 공고 정리`

4. [ ] **Phase 4: AnnouncementService 유닛 테스트**
   - 신규 파일: `apps/api/src/announcement/announcement.service.spec.ts`
   - 케이스:
     - `syncFromApi`: fetch mock — 정상 JSON 응답 → `upsert` 가 `externalId`/`fetchedAt` 포함하여 호출되는지.
     - XML 에러 응답: `upsert` **미호출** + error 로그.
     - 빈 items 배열: `upsert` 미호출 + warn 로그.
     - `findAll`: DB 데이터 있을 때 API 호출 없이 페이지네이션 반환.
     - `findOne`: 없는 id → null.
   - 커밋: `test(api): #59 [P4] AnnouncementService 유닛 테스트 추가`

### 영향 범위

| 영역 | 파일 | 영향 |
|------|------|------|
| DB 스키마 | `packages/db/src/entities/announcement.entity.ts` | 컬럼 2개 추가, UNIQUE 1개 |
| DB 마이그레이션 | `packages/db/src/migrations/<ts>-AnnouncementFetchedAt.ts` | 신규 |
| API 서비스 | `apps/api/src/announcement/announcement.service.ts` | upsert 전환 |
| API 정리 | `apps/api/src/cleanup/cleanup.service.ts` | 메서드 추가 |
| 테스트 | `cleanup.service.spec.ts`, `announcement.service.spec.ts` | 케이스 추가/신규 |

**무영향**: `announcement.controller.ts`, `announcement.module.ts`, DTO, web 프론트.

### 테스트 계획

로컬:
- `npm test -w @zipath/api` — 신규 `AnnouncementService` spec + 보강된 `CleanupService` spec 통과.
- `npm run migration:run -w @zipath/db` (로컬 docker DB) — 베이스라인 위에 새 마이그레이션 정상 적용.
- 수동 호출: `GET /announcements/sync` → DB 에 `fetched_at` 채워지는지 psql 확인 (`SELECT external_id, fetched_at FROM announcement LIMIT 5`).
- 재호출(동일 데이터): row 수 변화 없이 `fetched_at` 만 갱신되는지 확인 (upsert).

CI:
- lint + build + unit + E2E 통과.
- `auto-merge` 라벨 부여 시 develop 자동 squash merge.

수동 회귀:
- 기존 `findAll` / `findOne` / `match` 엔드포인트가 동일 응답 형식 유지하는지 (`organization` 필드 의미 변경에 따른 응답 영향 확인 — 현재 클라이언트는 `region`/`title` 위주 사용, 영향 없을 것으로 예상).
