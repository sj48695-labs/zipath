# #52 refactor(api): 청약 시뮬레이션 가점 계산 로직 리팩토링 — 재검증

- 플랜식별자: `A4769F16`
- 출처: `#52`
- 재개 사유: reopened 완료 조건을 `develop`과 대조하고, 이미 반영된 구현은 재구현하지 않는다.

## 이슈 정보 확인

- GitHub 이슈 본문·댓글 조회를 시도했으나 GitHub API rate limit으로 조회할 수 없었다.
- 따라서 PM 지시문과 로컬 `develop` 이력의 #52 커밋을 완료 조건의 근거로 사용했다. API 한도가 해제되면 이슈 본문·댓글에 이와 상충하는 새 요구사항이 없는지만 확인한다.

## 현재 구조 분석

- `develop`에는 이미 다음 #52 구현이 포함되어 있다.
  - `apps/api/src/subscription/subscription.service.ts`의 `calculatePoints()`가 `HOMELESS_SCORE_TABLE`, `DEPENDENT_SCORE_TABLE`, `SAVINGS_SCORE_TABLE`, `lookupScore()`로 세 가점 항목을 계산한다 (`bb39dec`).
  - 같은 서비스가 `SimulationInput.savingsMonths`를 실제 가입기간으로 우선 사용하고, 미입력 때만 나이 기반 추정을 사용한다 (`c027f3e`).
  - `apps/api/src/subscription/subscription.controller.ts`의 `simulateSchema`와 `packages/types/src/index.ts`가 `savingsMonths?: number`를 수용한다.
  - `apps/api/test/subscription.service.spec.ts`가 세 점수 테이블의 경계값, 실제 입력 우선, 입력 생략 폴백을 검증한다 (`ff226dc`, `97c4e2f`).
- 현재 브랜치의 `develop...HEAD` 코드 차이는 `apps/api/test/e2e/subscription.e2e-spec.ts`뿐이다. 이 테스트는 `SubscriptionController.simulate()`에 실제 입력·폴백·음수/소수 검증 회귀를 추가한 커밋 `e080c0f`이다.
- 기존 staged 삭제 상태인 `plans/52-refactor-api-subscription-score.md`는 본 플랜에서 변경하지 않는다.

## 변경 파일

- `apps/api/test/e2e/subscription.e2e-spec.ts` (이미 완료)
- `plans/52-refactor-api-subscription-score-revalidation.md` (본 재검증 플랜)

## Phase별 구현 계획

### Phase 1 (완료): 청약 가입기간 API 회귀 테스트 추가 (커밋 단위)

- 변경 파일: `apps/api/test/e2e/subscription.e2e-spec.ts` (신규, 1개)
- 구현: `SubscriptionController.simulate()`에 `savingsMonths: 180`을 전달해 `SubscriptionService.calculatePoints()`의 청약통장 점수 17점과 실제 개월 수 설명을 검증한다. 입력 미제공 시 나이 기반 폴백도 검증한다.
- 구현: `simulateSchema`의 `z.number().int().min(0)` 선례에 맞춰 음수와 소수 `savingsMonths`가 `BadRequestException`으로 거부되는지 검증한다. 점수 테이블과 서비스 계산 로직은 변경하지 않는다.
- 선례: `apps/api/test/e2e/loan.e2e-spec.ts`의 컨트롤러 직접 구성 및 `BadRequestException` 검증 패턴.
- 테스트: `npm run test:e2e -w @zipath/api`, `npm test -w @zipath/api`.

## 자체 검토

1. 완료 조건별 소유 파일을 `develop`과 대조했다. 점수 테이블, 실제 `savingsMonths`, 경계값 테스트 모두 이미 병합돼 누락이 없다.
2. 현재 브랜치에 남은 관심사는 API 입력 경로 회귀 테스트 하나이며, 단일 파일·단일 커밋으로 분리돼 있다.
3. 추가 P0 또는 후속 phase는 없다. 완료된 구현을 다시 변경하면 `develop` 대비 중복·회귀 위험만 만든다.
4. 2026-08-24에 API E2E 7 suites / 40 tests, API 단위 19 suites / 204 tests 통과를 재확인했다.

## 테스트 계획

1. 완료: `npm run test:e2e -w @zipath/api` — 7 suites, 40 tests 통과.
2. 완료: `npm test -w @zipath/api` — 19 suites, 204 tests 통과.

## 다음 단계

추가 구현 phase 없음. 이슈 본문·댓글 접근이 복구됐을 때 새 요구사항이 확인되는 경우에만 별도 phase를 추가한다.
