## Plan #60 사용자 청약 자격-공고 자동 매칭

- 플랜식별자: `3C01F0D4`
- 출처: GitHub Issue #60 (Parent #53, Phase 1 - Task 1.3)

### 지시사항 (원본 보존)

> ## 설명
> 사용자 입력(나이, 소득, 무주택기간 등)과 공고 요구사항을 비교하여 자동 매칭합니다.
>
> ## 작업 내용
> - 매칭 로직 구현 (사용자 조건 vs 공고 요구사항)
> - 매칭 결과 API 엔드포인트
>
> ## 변경 파일
> - `apps/api/src/announcement/announcement.service.ts`
> - `apps/api/src/announcement/dto/`

PM 구현 지침:
> apps/api AnnouncementService에 매칭 로직 구현, DTO로 나이/소득/무주택기간 등 입력받아 공고 요구사항 비교 후 결과 반환. PR #79(#59 엔티티) 머지 완료 후 실행할 것.

### 결정 사항 (Q&A)

**Q1. 단일 공고 매칭 로직은 이미 구현되어 있는가?**
A. 예. 이전 커밋 `0f80368 feat: 청약 자격-공고 자동 매칭 로직 구현 (#15)` 에서 이슈 #60 본문이 요구하는 범위가 이미 모두 구현됨:
- `AnnouncementService.matchAnnouncement(id, input)` — DB criteria 기반 매칭 + DB 기준 없을 때 `applyDefaultCriteria` 폴백 (1순위/2순위/신혼부부/생애최초/다자녀/노부모부양)
- `MatchRequestDto` (zod) — `age`, `income`, `homelessMonths`, `dependents?`, `region?`, `isMarried?`, `isFirstHome?`
- `MatchResultDto` / `MatchCriterionResult`
- `POST /announcements/:id/match` 엔드포인트 (controller)
- 유닛 테스트 `apps/api/test/announcement.service.spec.ts` + e2e `apps/api/test/e2e/announcement.e2e-spec.ts` (전체 112 테스트 green)

**Q2. 그렇다면 #60 에서 추가로 의미 있는 작업은 무엇인가?**
A. 이슈 제목의 핵심은 "**자동** 매칭(auto-matching)". 현재는 사용자가 공고 ID를 하나 지정해 매칭하는 방식뿐이다. 진짜 가치 있는 미구현 기능은 **사용자 조건 1회 입력 → 진행 중인 전체 공고를 스캔해 지원 가능한 공고만 자동 추려서 반환**하는 일괄(bulk) 매칭이다. 이것이 #60 에서 추가로 구현할 범위다.

**Q3. PR #79(#59 엔티티) 가 아직 머지되지 않았는데 진행 가능한가?**
A. 진행 가능. `Announcement` / `SubscriptionCriteria` 엔티티는 이미 현재 브랜치(develop 기반)에 존재하며 `matchAnnouncement` 가 정상 동작·테스트 통과 중이다. PR #79 는 `fetchedAt`/`externalId` 컬럼 추가건이며 이번 매칭 작업은 해당 컬럼에 의존하지 않으므로 머지 순서와 무관하게 안전하다. (충돌 시 develop 리베이스로 해소)

**Q4. "마감 지난 공고"도 매칭 대상에 포함하는가?**
A. 아니오. 일괄 매칭은 신청 가능한 공고만 의미 있으므로 `endDate >= now` 인 공고만 대상으로 한다. 결과는 지원 가능(`overallEligible === true`)한 공고만 반환한다.

**Q5. 법적 고지는?**
A. 응답에 기존 `message` 외에, 일괄 매칭 결과 DTO 레벨에 "참고용이며 법적 효력 없음" 고지 문구(`disclaimer`)를 포함한다 (프로젝트 규칙).

### 구현 단계 (Phase)

1. [ ] Phase 1: 일괄 매칭 DTO 정의 — `apps/api/src/announcement/dto/match-all-result.dto.ts` 신규. `MatchAllResultDto { matchedCount, matches: MatchResultDto[], disclaimer }` 인터페이스 정의. 입력은 기존 `match-request.dto.ts` 의 `MatchRequestDto`/`matchRequestSchema` 재사용. 커밋: `feat(api): #60 일괄 매칭 결과 DTO 정의`

2. [ ] Phase 2: 서비스 일괄 매칭 로직 구현 — `apps/api/src/announcement/announcement.service.ts` 에 `matchAllAnnouncements(input: MatchRequestDto): Promise<MatchAllResultDto>` 추가. `endDate >= now` 인 활성 공고를 조회 → 각 공고에 대해 기존 `matchAnnouncement` 단일 매칭 재사용(중복 로직 금지) → `overallEligible === true` 인 결과만 필터링해 반환. `disclaimer` 문구 포함. 커밋: `feat(api): #60 사용자 조건 기반 전체 공고 자동 매칭 로직 구현`

3. [ ] Phase 3: 컨트롤러 엔드포인트 추가 — `apps/api/src/announcement/announcement.controller.ts` 에 `POST /announcements/match` 추가 (기존 `matchRequestSchema.safeParse` 검증 패턴 동일 재사용, 실패 시 `BadRequestException`). 라우트 순서 주의: `:id/match` 보다 충돌 없도록 정적 경로 우선 배치. 커밋: `feat(api): #60 전체 공고 일괄 매칭 엔드포인트 추가`

4. [ ] Phase 4: 테스트 추가 — `apps/api/test/announcement.service.spec.ts` 에 `matchAllAnnouncements` describe 블록 추가(활성 공고 필터링, eligible 공고만 반환, matchedCount 정확성, 매칭 0건 케이스). `apps/api/test/e2e/announcement.e2e-spec.ts` 에 `POST /api/announcements/match` 성공/검증실패 케이스 추가. 커밋: `test(api): #60 일괄 자동 매칭 유닛 + e2e 테스트`

### 영향 범위

- 신규: `apps/api/src/announcement/dto/match-all-result.dto.ts`
- 수정: `apps/api/src/announcement/announcement.service.ts` (메서드 추가, 기존 로직 변경 없음)
- 수정: `apps/api/src/announcement/announcement.controller.ts` (라우트 추가)
- 수정: `apps/api/test/announcement.service.spec.ts`, `apps/api/test/e2e/announcement.e2e-spec.ts`
- DB 스키마 변경 없음. PR #79 와 파일/컬럼 충돌 없음.

### 테스트 계획

- 명령: `npm test -w @zipath/api` (유닛 + e2e 통합 실행, 현재 112 통과 → 추가 후 전체 green 유지)
- 단위: `matchAllAnnouncements`
  - 활성 공고만 조회되는지(`endDate >= now` 쿼리 조건 검증)
  - eligible 공고만 결과에 포함, ineligible 제외
  - `matchedCount === matches.length`
  - 매칭 0건일 때 빈 배열 + 0 반환
  - `disclaimer` 문구 포함
- e2e: `POST /api/announcements/match`
  - 유효 입력 → 200 + 매칭 결과 구조
  - 잘못된 입력(예: age 누락) → 400

### 비고 (중요)

이슈 #60 본문에 명시된 단일 공고 매칭 범위(`matchAnnouncement` + DTO + `:id/match` 엔드포인트)는 **이미 구현·테스트 완료** 상태다. 본 플랜은 이슈 제목의 "자동(auto) 매칭" 취지를 충족하는 **전체 공고 일괄 매칭** 기능을 추가 구현한다. 만약 PM 의도가 "기존 구현 검토/문서화"에 그친다면 Phase 2~3 생략 후 기존 구현 검증만 수행하도록 축소 가능.
