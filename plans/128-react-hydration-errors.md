# #128 실거래가 페이지 hydration 오류 수정 계획

- 플랜식별자: `C4A91F2B`
- 출처: `#128`
- 동일 증상 참고: `#109`

## 현재 구조 분석

- `apps/web/src/app/layout.tsx` 는 이미 `<html>` / `<body>` 에 `suppressHydrationWarning` 을 넣고 있어서, `#103` 계열의 루트 주입 문제는 이번 범위가 아니다.
- `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts` 는 `monthOptions`, `dealYmd`, `trendFromMonth`, `trendToMonth` 를 모두 빈 문자열/빈 배열로 시작한 뒤 `useEffect` 에서만 날짜 기반 값을 채운다. 현재 패턴 자체는 SSR/CSR 첫 렌더를 맞추는 방향이다.
- `apps/web/src/app/real-price/_components/RealPriceClient.tsx` 와 `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx` 는 같은 훅을 공유하므로, 여기서 초기 렌더 DOM 이 갈리면 두 라우트가 같이 흔들린다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts` 가 이미 있어, 이번 이슈는 새 회귀 테스트를 추가하기보다 기존 테스트를 더 정확하게 만들어야 한다.
- 따라서 이번 작업은 `#109` 와 같은 루트 레이아웃 대응을 반복하지 않고, 실거래가 공통 월 상태의 단일 소스화 + direct entry 회귀 검증에 집중한다.

## 변경 파일

- `apps/web/src/app/real-price/_lib/monthOptions.ts`
- `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts`
- `apps/web/src/app/real-price/_lib/monthOptions.test.ts`
- `apps/web-e2e/tests/real-price-hydration.spec.ts`

## Phase별 구현 계획

### Phase 1: 실거래가 월 초기 상태를 순수 helper 로 단일화

- 변경 파일: `apps/web/src/app/real-price/_lib/monthOptions.ts`, `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts`, `apps/web/src/app/real-price/_lib/monthOptions.test.ts`
- 구현:
  - `monthOptions.ts` 에 `getInitialRealPriceMonthState()` 를 추가해서 `{ dealYmd: "", trendFromMonth: "", trendToMonth: "" }` 를 한 곳에서 반환한다.
  - `useRealPriceMonthDefaults.ts` 는 `useState(getInitialRealPriceMonthState())` 형태로 바꾸고, `monthOptions` 만 별도로 빈 배열로 시작한다.
  - `buildMonthOptions(new Date())` 는 계속 `useEffect` 내부에서만 실행해 SSR 첫 렌더에 날짜 의존값이 새지 않게 유지한다.
  - `monthOptions.test.ts` 에서 빈 초기 상태와 고정 날짜 상태를 둘 다 검증해, 서버/클라이언트 첫 렌더의 기준이 흔들리지 않게 만든다.
- 테스트:
  - `npm test -w @zipath/web -- monthOptions`
  - 필요 시 `npm run build -w @zipath/web` 로 hydration 관련 타입/렌더 에러가 없는지 점검

### Phase 2: `/real-price` / `/real-price/compare` hydration 회귀를 direct entry 기준으로 고정

- 변경 파일: `apps/web-e2e/tests/real-price-hydration.spec.ts`
- 구현:
  - 기존 console 수집 로직을 React hydration warning/error 패턴까지 포함하도록 유지·보강한다.
  - `/real-price` 와 `/real-price/compare` 를 각각 direct entry 로 열어서, 첫 진입 시 `hydration`, `did not match`, `expected server html`, `minified react error #418/#423/#425` 류 메시지가 0건인지 확인한다.
  - 이미 있는 `real-price-compare.spec.ts` 는 상호작용 회귀용으로 유지하고, hydration 스펙은 콘솔 회귀 전용으로 분리한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- real-price-hydration`
  - 필요 시 브라우저 콘솔에서 `/real-price` 와 `/real-price/compare` 직접 진입 재확인

### Phase 3: 최종 검증

- 변경 파일: 없음
- 구현:
  - 웹 빌드와 e2e 회귀를 함께 돌려, 월 선택 combobox 초기 DOM 이 서버/클라이언트에서 동일한지 확인한다.
  - `#109` 와 겹치는 루트 레이아웃 대응은 추가하지 않고, 이번 수정이 실거래가 공통 상태와 회귀 테스트에만 한정되는지 확인한다.
- 테스트:
  - `npm run build -w @zipath/web`
  - `npm test -w @zipath/web-e2e`
  - 필요 시 `npm run lint -w @zipath/web`

### 현재 검증 상태

- `npm test -w @zipath/web -- monthOptions` 통과
- `npm run build -w @zipath/web` 통과
- 로컬 e2e는 이 샌드박스에서 서버 listen 이 `EPERM` 으로 막혀 직접 실행하지 못함

## 테스트 계획

1. `monthOptions.test.ts` 로 빈 초기 상태와 고정 날짜 기준 month state 를 검증한다.
2. `real-price-hydration.spec.ts` 로 `/real-price` 와 `/real-price/compare` direct entry 시 hydration console 이 비어 있는지 검증한다.
3. `npm run build -w @zipath/web` 로 SSR/CSR 불일치가 빌드 단계에서 재발하지 않는지 확인한다.
4. `npm run test -w @zipath/web-e2e` 로 회귀 테스트가 실제 브라우저 진입을 막아내는지 확인한다.
