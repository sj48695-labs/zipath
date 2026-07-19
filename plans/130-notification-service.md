## Plan #130 청약 자격 시뮬레이션 입력 개선

- 플랜식별자: `d7ef6939`
- 출처: GitHub Issue #130

### 현재 구조 분석

- `apps/api/src/subscription/subscription.controller.ts` 와 `subscription.service.ts` 가 청약 시뮬레이션 입력/출력을 담당한다.
- `packages/types/src/index.ts` 에 공통 청약 시뮬레이션 타입이 있다.
- `apps/web/src/app/subscription/page.tsx` 가 청약 폼과 결과 UI를 렌더링한다.
- 기존 구현은 청약통장 가입기간을 단일 개월 값으로 받았고, 서비스는 만 19세 기준 추정값으로 가점을 계산했다.

### Phase 1 (완료): 입력 계약을 년/월로 분리하고 실제 입력값으로 계산

- 변경 파일:
  - `packages/types/src/index.ts`
  - `apps/api/src/subscription/subscription.controller.ts`
  - `apps/api/src/subscription/subscription.service.ts`
  - `apps/api/test/subscription.controller.spec.ts`
  - `apps/api/test/subscription.service.spec.ts`
- 구현:
  - 청약통장 가입기간을 `savingsYears` 와 `savingsMonths` 로 분리한다.
  - 백엔드는 `년 * 12 + 월` 기준으로 가점을 계산한다.
  - 만 19세 추정값과 `추정 가입기간` 문구를 제거한다.
- 테스트:
  - controller spec 에서 필수 입력값과 월 범위 검증을 확인한다.
  - service spec 에서 경계값, 실제 입력값 계산, age 비의존성을 검증한다.

### Phase 2 (완료): 웹 폼과 결과 문구 갱신

- 변경 파일:
  - `apps/web/src/app/subscription/page.tsx`
  - `apps/web/src/app/subscription/utils.ts`
  - `apps/web/src/app/subscription/page.test.tsx`
  - `apps/web/src/app/subscription/utils.test.ts`
- 구현:
  - 청약통장 가입기간 입력을 년/월 두 필드로 바꾼다.
  - 폼 제출 payload 를 `SubscriptionSimulationInput` 으로 변환하는 helper 를 분리한다.
  - 결과 카드 문구를 `입력 기준` 으로 갱신하고, UI 에 `참고용이며 법적 효력 없음` 고지를 노출한다.
- 테스트:
  - helper test 에서 문자열 입력이 숫자 payload 로 변환되는지 확인한다.
  - page test 에서 년/월 입력 필드와 법적 고지 노출을 확인한다.

### Phase 3 (완료): 검증

- 실행:
  - `npm test -w @zipath/api`
  - `npx turbo lint`
  - `npx turbo build`
- 결과:
  - API unit test 통과
  - lint 통과
  - build 통과

