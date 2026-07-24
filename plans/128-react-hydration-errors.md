# #128 실거래가 direct access hydration 회귀 계획

- 플랜식별자: `334f576b`
- 출처: `#128`
- 동일 증상 참고: `#109`

## 현재 구조 분석

- `apps/web/src/app/layout.tsx` 는 이미 `<html>` / `<body>` 에 `suppressHydrationWarning` 이 들어가 있으므로, 이번 이슈는 루트 태그 경고를 숨기는 문제가 아니다.
- `apps/web/src/app/real-price/_lib/monthOptions.ts` 는 날짜 기반 month 옵션과 SSR/CSR 공통 초기 상태를 분리해두는 중심 유틸이다.
- `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts` 는 서버에서 만든 기본값을 클라이언트 초기 state 로 그대로 주입하는 단일 진입점이다.
- `apps/web/src/app/real-price/page.tsx` 와 `apps/web/src/app/real-price/compare/page.tsx` 는 direct access 시각 기준의 기본값을 먼저 만든 뒤 client 컴포넌트에 전달한다.
- `apps/web/src/app/real-price/_components/RealPriceClient.tsx` 와 `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx` 는 같은 month-state 훅을 공유하므로, 첫 렌더 시점의 값이 달라지면 두 라우트가 함께 hydration 경고를 낼 수 있다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts` 는 `/real-price` 와 `/real-price/compare` direct access 시 hydration 계열 콘솔 메시지를 수집하는 회귀 지점이다.

## 변경 파일

- `apps/web-e2e/tests/real-price-hydration.spec.ts`
- `apps/web/src/app/real-price/_lib/monthOptions.test.ts`
- `apps/web/src/app/real-price/_lib/monthOptions.ts`
- `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts`
- `apps/web/src/app/real-price/page.tsx`
- `apps/web/src/app/real-price/compare/page.tsx`
- `apps/web/src/app/real-price/_components/RealPriceClient.tsx`
- `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx`

## Phase별 구현 계획

### Phase 1: direct access 회귀를 먼저 고정한다

- 변경 파일: `apps/web-e2e/tests/real-price-hydration.spec.ts`, `apps/web/src/app/real-price/_lib/monthOptions.test.ts`
- 구현:
  - `/real-price` 와 `/real-price/compare` 를 직접 열었을 때 hydration 경고 패턴을 수집하도록 유지한다.
  - `hydration`, `did not match`, `text content does not match`, `expected server html`, `minified react error #418/#423/#425` 류 메시지만 실패로 간주한다.
  - `monthOptions.test.ts` 에서 날짜 고정 입력을 사용해 month 옵션과 초기 state 가 흔들리지 않는지 확인한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- real-price-hydration`
  - `npm test -w @zipath/web -- monthOptions`

### Phase 2: month-state 공통 경로를 서버/클라이언트 양쪽에서 고정한다

- 의존성: Phase 1
- 변경 파일: `apps/web/src/app/real-price/_lib/monthOptions.ts`, `apps/web/src/app/real-price/_lib/useRealPriceMonthDefaults.ts`
- 구현:
  - `buildMonthOptions(referenceDate)` 와 `buildRealPriceMonthState(monthOptions)` 를 SSR/CSR 공통 계산 경로로 유지한다.
  - `getInitialRealPriceMonthState()` 는 비어 있는 안정적 초기값만 반환하고, 렌더 타임에 별도 날짜 계산을 추가하지 않는다.
  - `useRealPriceMonthDefaults()` 는 서버에서 만든 `initialMonthDefaults` 를 그대로 초기 state 로 사용한다.
- 테스트:
  - `npm test -w @zipath/web -- monthOptions`
  - `npm run build -w @zipath/web`

### Phase 3: direct access entry point 에서 동일한 기본값을 주입한다

- 의존성: Phase 2
- 변경 파일: `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/real-price/compare/page.tsx`, `apps/web/src/app/real-price/_components/RealPriceClient.tsx`, `apps/web/src/app/real-price/compare/_components/RegionCompareClient.tsx`
- 구현:
  - 두 page entry 에서 `buildRealPriceMonthDefaults(new Date())` 를 한 번만 계산해 client 컴포넌트에 전달한다.
  - 두 client 는 `useRealPriceMonthDefaults()` 만 통해 `dealYmd`, `trendFromMonth`, `trendToMonth` 를 읽고, 렌더 시점에 별도 날짜 계산을 하지 않는다.
  - direct access 시 첫 렌더에서 month select 값이 달라져 hydration mismatch 가 발생하는 로컬 state 계산을 제거한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- real-price-hydration`
  - `npm run build -w @zipath/web`

## 테스트 계획

1. `apps/web-e2e/tests/real-price-hydration.spec.ts` 로 `/real-price` 와 `/real-price/compare` direct access 시 hydration 콘솔이 비어 있는지 확인한다.
2. `apps/web/src/app/real-price/_lib/monthOptions.test.ts` 로 고정 날짜 기준 month 옵션과 초기 state 가 deterministic 한지 확인한다.
3. `npm run build -w @zipath/web` 로 SSR/CSR 불일치가 빌드 단계에서 재발하지 않는지 확인한다.
4. 필요 시 `npm run lint -w @zipath/web` 로 client/server 경계 수정이 타입 및 린트 규칙을 깨지 않는지 확인한다.
