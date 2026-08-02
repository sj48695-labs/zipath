# #52 refactor(api): 청약 시뮬레이션 가점 계산 로직 리팩토링

- 플랜식별자: `7AD57F63`
- 출처: `#52`

## 현재 구조 분석

- `apps/api/src/subscription/subscription.service.ts`의 `calculatePoints()`는 이미 `HOMELESS_SCORE_TABLE`, `DEPENDENT_SCORE_TABLE`, `SAVINGS_SCORE_TABLE`과 `lookupScore()`를 사용한다. 기존의 장황한 if-chain은 남아 있지 않다.
- 같은 서비스는 `SimulationInput.savingsMonths`가 제공되면 그 값을 연 단위로 환산하고, 없을 때만 기존 나이 기반 추정을 폴백으로 사용한다.
- `apps/api/src/subscription/subscription.controller.ts`의 `simulateSchema`와 `packages/types/src/index.ts`의 `SubscriptionSimulationInput`에도 `savingsMonths?: number`가 이미 선언되어 있다.
- `apps/api/test/subscription.service.spec.ts`에는 세 점수 항목의 경계값, `savingsMonths` 실제 입력 우선, 입력 생략 시 폴백을 검증하는 단위 테스트가 있다.
- `develop`과 현재 브랜치의 코드 차이는 없으며, `npm test -w @zipath/api`와 `npm run test:e2e -w @zipath/api`는 모두 통과했다. 다만 `apps/api/test/e2e/`에는 subscription 컨트롤러의 입력 전달·검증을 보장하는 회귀 테스트가 없다.

## 변경 파일

- `apps/api/test/e2e/subscription.e2e-spec.ts` (신규)

## Phase별 구현 계획

### Phase 1: 청약 시뮬레이션 API 입력 회귀 테스트 추가 (커밋 단위)

- 변경 파일: `apps/api/test/e2e/subscription.e2e-spec.ts` (신규, 1개)
- 구현: `SubscriptionController`와 `SubscriptionService`를 직접 구성하는 `apps/api/test/e2e/loan.e2e-spec.ts` 패턴을 따른다. `POST /api/subscription/simulate` 관례를 설명 이름에 반영하고, `savingsMonths: 180` 요청이 서비스 결과의 `청약통장 가입기간` 점수 17점 및 개월 수 설명으로 반환되는지 검증한다. `savingsMonths` 생략 시 기존 나이 기반 폴백 결과도 확인한다.
- 구현: 같은 파일에서 `apps/api/src/subscription/subscription.controller.ts`의 `simulateSchema` 선례에 맞춰 음수·소수 `savingsMonths`가 `BadRequestException`으로 거부되는지 검증한다. 점수 테이블 또는 서비스 계산 로직은 변경하지 않는다.
- 테스트: `npm run test:e2e -w @zipath/api` 실행 후, 회귀 범위를 포함해 `npm test -w @zipath/api`도 실행한다.

## 테스트 계획

1. `npm run test:e2e -w @zipath/api`로 subscription 입력 전달·검증 회귀 테스트와 기존 API e2e 6개 스위트를 통과시킨다.
2. `npm test -w @zipath/api`로 기존 가점 경계값 및 모든 API 단위 테스트가 유지되는지 확인한다.
