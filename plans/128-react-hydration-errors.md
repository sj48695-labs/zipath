# #128 실거래가 direct access hydration 회귀 계획

- 플랜식별자: `C818BC56`
- 출처: `#128`
- 동일 증상 참고: `#109`

## 현재 구조 분석

- `apps/web/src/app/layout.tsx` 는 이미 `<html>` / `<body>` 에 `suppressHydrationWarning` 이 들어가 있으므로, 이번 이슈는 `#109` 계열의 루트 주입 문제를 다시 푸는 작업이 아니다.
- `apps/web/src/app/real-price/_lib/monthOptions.ts` 와 `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts` 는 SSR 첫 렌더에서 빈 상태를 반환하고, `useEffect` 이후에만 현재 시각 기반 월 옵션을 채우는 결정적 초기값 패턴을 사용한다.
- `apps/web/src/app/real-price/_components/RealPriceClient.tsx` 와 `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx` 는 같은 month-state 훅을 공유하므로, direct access 시 초기 렌더가 갈리면 두 라우트가 함께 흔들린다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts` 가 이미 direct entry 콘솔 수집을 하고 있으므로, 이번 이슈는 동일 구현을 반복하기보다 direct access 회귀를 더 정확하게 고정하는 쪽이 맞다.
- 현재 코드 상태만 보면 원래의 month combobox mismatch 패턴은 이미 해소된 방향이므로, 남은 작업은 "실제 재현 여부 확인"과 "재발 시 가장 좁은 공통 경로만 수정"이다.

## 변경 파일

- `apps/web-e2e/tests/real-price-hydration.spec.ts`
- `apps/web/src/app/real-price/_lib/monthOptions.ts`
- `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts`
- `apps/web/src/app/real-price/_components/RealPriceClient.tsx`
- `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx`

## Phase별 구현 계획

### Phase 1 (완료): direct access 회귀를 콘솔 기준으로 고정

- 변경 파일: `apps/web-e2e/tests/real-price-hydration.spec.ts`
- 구현:
  - `/real-price` 와 `/real-price/compare` 를 각각 직접 열어, 첫 로드 시 React hydration 경고 패턴을 모두 수집한다.
  - 수집 패턴은 `hydration`, `did not match`, `text content does not match`, `expected server html`, `minified react error #418/#423/#425` 를 포함하도록 유지한다.
  - 브라우저 확장이나 일반 네트워크 오류는 제외하고, 실제 hydration 계열 메시지만 실패로 간주한다.
  - direct entry 로드 후 헤딩이 보이는지와 hydration 메시지가 비어 있는지를 함께 확인해, 단순 페이지 로딩 실패와 구분한다.
  - 실거래가 페이지의 법적 고지 `참고용이며 법적 효력 없음` 도 함께 검증한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- real-price-hydration`
  - `npm run build -w @zipath/web`

### Phase 2: 재현 시에만 month-state 공통 경로를 다시 잠금

- 의존성: Phase 1
- 변경 파일: `apps/web/src/app/real-price/_lib/monthOptions.ts`, `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts`, `apps/web/src/app/real-price/_components/RealPriceClient.tsx`, `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx`
- 구현:
  - `getInitialRealPriceMonthState()` 를 SSR/CSR 공통의 유일한 빈 초기 상태로 유지한다.
  - `buildMonthOptions(new Date())` 는 `useEffect` 외부로 새지 않게 유지하고, 두 페이지는 이 훅만 통해 `dealYmd` / `trendFromMonth` / `trendToMonth` 를 받는다.
  - direct access 시 first render 에서 셀렉트 값이 채워져 보이도록 만드는 로컬 상태나 렌더 타임 날짜 계산이 있으면 제거한다.
  - 이 phase 는 실제 hydration mismatch 가 다시 재현될 때만 적용하고, 재현되지 않으면 "원인 없음" 으로 기록한다.
- 테스트:
  - `npm test -w @zipath/web -- monthOptions`
  - `npm test -w @zipath/web-e2e -- real-price-hydration`
  - `npm run build -w @zipath/web`

## 테스트 계획

1. `apps/web-e2e/tests/real-price-hydration.spec.ts` 로 `/real-price` 와 `/real-price/compare` direct access 시 hydration 콘솔이 비어 있는지 확인한다.
2. `apps/web/src/app/real-price/_lib/monthOptions.test.ts` 로 빈 초기 상태와 고정 날짜 month state 가 흔들리지 않는지 확인한다.
3. `npm run build -w @zipath/web` 로 SSR/CSR 불일치가 빌드 단계에서 재발하지 않는지 확인한다.
4. 필요 시 `npm run lint -w @zipath/web` 로 hydration 관련 수정이 타입/린트 규칙을 깨지 않는지 확인한다.
