# #130 청약 자격 시뮬레이션 입력 개선

- 플랜식별자: `7b9de98c`
- 출처: GitHub Issue #130

## 현재 구조 분석

- `apps/api/src/subscription/subscription.controller.ts` 와 `apps/api/src/subscription/subscription.service.ts` 가 청약 시뮬레이션 입력 검증과 점수 계산을 담당한다.
- `packages/types/src/index.ts` 에 공통 청약 시뮬레이션 타입이 있다.
- `apps/web/src/app/subscription/page.tsx` 가 청약 폼과 결과 UI를 렌더링한다.
- 기존 구현은 청약통장 가입기간을 단일 개월 값이 아닌 `년/월` 분리 입력으로 받도록 정리되어야 하고, 백엔드 점수 계산도 실제 입력값을 그대로 사용해야 한다.

## 변경 파일

- `packages/types/src/index.ts`
- `apps/api/src/subscription/subscription.controller.ts`
- `apps/api/src/subscription/subscription.service.ts`
- `apps/api/test/subscription.controller.spec.ts`
- `apps/api/test/subscription.service.spec.ts`
- `apps/web/src/app/subscription/page.tsx`
- `apps/web/src/app/subscription/utils.ts`
- `apps/web/src/app/subscription/page.test.tsx`
- `apps/web/src/app/subscription/utils.test.ts`

## Phase별 구현 계획

### Phase 1 (완료): API 입력 계약과 점수 계산 정리

- 변경 파일:
  - `packages/types/src/index.ts`
  - `apps/api/src/subscription/subscription.controller.ts`
  - `apps/api/src/subscription/subscription.service.ts`
  - `apps/api/test/subscription.controller.spec.ts`
  - `apps/api/test/subscription.service.spec.ts`
- 구현:
  - 청약통장 가입기간 입력을 `savingsYears` 와 `savingsMonths` 로 분리한다.
  - controller 에서 `savingsMonths` 범위 검증을 추가하고, 누락/오입력 요청을 거른다.
  - service 에서 가점을 `년 * 12 + 월` 기준으로 계산하고, `추정 가입기간` 같은 문구를 제거한다.
  - `SubscriptionSimulationInput`/`Response` 타입이 새 입력 계약과 일치하도록 정리한다.
- 테스트:
  - controller spec 에서 필수 입력값과 월 범위 검증을 확인한다.
  - service spec 에서 경계값, 실제 입력값 계산, 연/월 결합 점수 계산을 검증한다.

### Phase 2 (완료): 웹 폼과 결과 문구 갱신

- 변경 파일:
  - `apps/web/src/app/subscription/page.tsx`
  - `apps/web/src/app/subscription/utils.ts`
  - `apps/web/src/app/subscription/page.test.tsx`
  - `apps/web/src/app/subscription/utils.test.ts`
- 구현:
  - 청약통장 가입기간 입력을 년/월 두 필드로 나눈다.
  - 폼 제출 payload 를 `SubscriptionSimulationInput` 으로 변환하는 helper 를 분리한다.
  - 결과 카드와 안내 문구를 `입력 기준` 중심으로 정리하고, `참고용이며 법적 효력 없음` 고지를 유지한다.
- 테스트:
  - helper test 에서 문자열 입력이 숫자 payload 로 변환되는지 확인한다.
  - page test 에서 년/월 입력 필드와 법적 고지 노출을 확인한다.

### Phase 3 (완료): 검증

- 변경 파일:
  - 없음
- 구현:
  - API unit test, lint, build 를 순서대로 실행해 회귀를 확인한다.
- 테스트:
  - `npm test -w @zipath/api`
  - `npx turbo lint`
  - `npx turbo build`

## 테스트 계획

1. `npm test -w @zipath/api`
2. `npx turbo lint`
3. `npx turbo build`
