# #52 청약 시뮬레이션 가점 계산 로직 리팩토링

- 플랜식별자: `59BB1F3F`
- 출처: `#52`

## 현재 구조 분석

`apps/api/src/subscription/subscription.service.ts`의 `calculatePoints()` (90-164줄)가 3개 가점 카테고리를 if문 체인으로 계산한다 (84점 만점).

- **무주택 기간** (94-118줄, 최대 32점): `homelessYears` 1~15년을 15개 if문으로 매핑 (1년당 2점, 15년 32점)
- **부양가족 수** (120-134줄, 최대 35점): `dependents` 1~6명을 6개 if문으로 매핑
- **청약통장 가입기간** (136-161줄, 최대 17점): 실제 입력이 없어 `Math.max(0, age - 19)`로 **나이에서 가입기간을 추정** (138줄). 1~15년을 15개 if문으로 매핑

세 카테고리 모두 "범위 → 점수" 동일 패턴이라 테이블 룩업으로 통합 가능.

### 관련 파일/심볼

- 서비스: `apps/api/src/subscription/subscription.service.ts` — `SimulationInput`(3-11줄), `PointBreakdown`(13-18줄), `calculatePoints()`(90-164줄)
- 컨트롤러: `apps/api/src/subscription/subscription.controller.ts` — `simulateSchema`(5-13줄) zod 검증
- 타입: `packages/types/src/index.ts` — `SubscriptionSimulationInput`(33-41줄)
- 웹 폼: `apps/web/src/app/subscription/page.tsx` — `form` state(44-51줄), 입력 필드 grid(135줄~), `handleSubmit` payload(104-116줄)
- 테스트: `apps/api/test/subscription.service.spec.ts` — "should calculate points"(88-99줄)는 `totalPoints > 0`, `maxPoints === 84`만 간접 검증

## 변경 파일

- apps/api/src/subscription/subscription.service.ts (P1, P2)
- apps/api/test/subscription.service.spec.ts (P1, P2)
- packages/types/src/index.ts (P2)
- apps/api/src/subscription/subscription.controller.ts (P2)
- apps/web/src/app/subscription/page.tsx (P3)

## Phase별 구현 계획

### Phase 1 (완료): if-chain → 점수 테이블 룩업 리팩토링 (커밋 단위)

기능 변경 없이 동일 결과를 보장하는 순수 리팩토링. `refactor(api)`.

- **변경 파일**: `apps/api/src/subscription/subscription.service.ts`, `apps/api/test/subscription.service.spec.ts`
- **구현**:
  - 점수 테이블 상수 추가 (모듈 스코프, `SubscriptionService` 위): 각 카테고리를 `{ threshold, score }` 내림차순 배열로 정의
    - `HOMELESS_SCORE_TABLE` (32점 만점): `[{15,32},{14,28},{13,26},...,{1,2}]`
    - `DEPENDENT_SCORE_TABLE` (35점 만점): `[{6,35},{5,25},{4,20},{3,15},{2,10},{1,5}]`
    - `SAVINGS_SCORE_TABLE` (17점 만점): `[{15,17},{14,14},{13,13},...,{1,1}]`
  - 공통 헬퍼 `lookupScore(table, value)`: 테이블을 순회하며 `value >= threshold`인 첫 항목의 `score` 반환, 없으면 0 (private 메서드 또는 모듈 함수)
  - `calculatePoints()`의 세 if-chain을 `lookupScore(TABLE, years/count)` 호출로 교체. `description` 문자열은 기존과 동일하게 유지
  - 청약통장 항목은 이 Phase에서는 **기존 로직 그대로** `Math.max(0, age - 19)` 유지 (Phase 2에서 입력 기반으로 전환)
  - 테이블 값이 기존 if문 결과와 1:1 일치하는지 확인 (특히 무주택 15년=32점, 가입 15년=17점 점프 구간)
- **테스트**:
  - 기존 "should calculate points" 통과 (age 35 → 동일 totalPoints)
  - `apps/api/test/subscription.service.spec.ts`에 카테고리별 경계값 단위 검증 추가: 무주택 `homelessMonths`별 `points[0].score` (예: 14년→28, 15년→32), 부양가족 경계(6명→35), 가입기간 경계. 리팩토링 전후 동일 값 보장이 목적
- **검증**: `npm test -w @zipath/api`

### Phase 2: 청약통장 가입기간 실제 입력 추가 (커밋 단위)

- **의존성**: Phase 1 (리팩토링된 `SAVINGS_SCORE_TABLE`/`lookupScore` 사용)
- **변경 파일**: `packages/types/src/index.ts`, `apps/api/src/subscription/subscription.controller.ts`, `apps/api/src/subscription/subscription.service.ts`, `apps/api/test/subscription.service.spec.ts`
- **구현**:
  - `packages/types/src/index.ts` `SubscriptionSimulationInput`(33-41줄)에 `savingsMonths?: number; // 청약통장 가입 개월` 추가
  - `subscription.controller.ts` `simulateSchema`(5-13줄)에 `savingsMonths: z.number().int().min(0).optional()` 추가 (`homelessMonths` 패턴 미러)
  - `subscription.service.ts` `SimulationInput`(3-11줄)에 `savingsMonths?: number` 추가
  - `calculatePoints()` 청약통장 항목: `savingsMonths`가 있으면 `Math.floor(savingsMonths / 12)`로 가입 연수 계산, **없으면 기존 `Math.max(0, age - 19)` 추정으로 폴백** (기존 테스트 동일 결과 보장). `description`은 실제 입력 시 "가입 N년 (M개월)", 폴백 시 기존 "추정 가입기간 약 N년 (만 19세부터 계산)"로 분기
- **테스트**:
  - `savingsMonths` 미제공 시 기존 결과 동일 (폴백) — 기존 테스트로 커버
  - `savingsMonths` 제공 시 실제 입력 기반 점수 검증 케이스 추가 (예: `savingsMonths: 180`(15년)→17점, age로는 다른 값이 나오는 입력으로 폴백과 구분)
- **검증**: `npm test -w @zipath/api`, `npx turbo build`

### Phase 3: 웹 폼에 청약통장 가입기간 입력 필드 추가 (커밋 단위)

- **의존성**: Phase 2 (API가 `savingsMonths` 수용)
- **변경 파일**: `apps/web/src/app/subscription/page.tsx`
- **구현**:
  - `form` state(44-51줄)에 `savingsMonths: ""` 추가
  - 입력 필드 grid(135줄~)에 "청약통장 가입기간 (개월)" number 입력 추가 — "무주택 기간 (개월)"/"부양가족 수" 필드 패턴 미러 (선택 입력)
  - `handleSubmit` payload(104-116줄)에 `savingsMonths: form.savingsMonths ? Number(form.savingsMonths) : undefined` 추가
  - 파일 상단 `SimulationPayload` 타입에 `savingsMonths?` 반영 (해당 타입이 로컬 정의면 같이 수정)
- **테스트**: `npx turbo build` (web 빌드 통과), 로컬 dev에서 폼 제출 시 가점 반영 수동 확인

## 테스트 계획

1. `npm test -w @zipath/api` — Phase 1 리팩토링 전후 동일 결과(경계값 단위 테스트 포함), Phase 2 `savingsMonths` 입력/폴백 분기
2. `npx turbo build` — types/api/web 빌드 통과
3. 로컬 수동 확인 — 웹 폼에 가입기간 입력 후 청약통장 가점이 입력 기반으로 계산되는지
