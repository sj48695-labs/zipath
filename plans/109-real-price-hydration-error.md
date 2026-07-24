# #109 실거래가 hydration 오류 수정

- 플랜식별자: `48f0a46b`
- 출처: `#109`

## 현재 구조 분석

- `/real-price/page.tsx` 와 `/real-price/compare/page.tsx` 둘 다 월 옵션 생성 로직을 각자 들고 있다. `getMonthOptions()` / `buildMonthOptions()` 가 `new Date()` 에 의존하므로, 첫 렌더 기준을 페이지별로 따로 계산하는 구조다.
- 두 페이지 모두 `dealYmd`, `trendFromMonth`, `trendToMonth` 를 `""` 로 시작한 뒤 `useEffect` 에서 채우는 방식이다. 이 자체는 마운트 이후 업데이트라 안전하지만, 월 옵션과 선택값 초기화가 흩어져 있어 SSR/CSR 첫 렌더 일관성을 보장하는 공통 장치가 없다.
- 차트는 `next/dynamic(..., { ssr: false, loading: ... })` 로 감싸져 있지만, 로딩 대체 마크업이 페이지마다 중복되어 있다. 이 위치가 `/real-price` 와 `/real-price/compare` 의 공통 hydration 민감 구간이다.
- `SiteHeader` 는 두 경로에 공통으로 붙지만, `NotificationBell` 과 `AuthContext` 는 현재 첫 렌더가 `null` / `false` 기반이라 우선순위는 낮다. 이번 이슈의 직접 원인은 실거래가 페이지 내부의 날짜/선택값/차트 렌더 경로로 본다.
- 이미 `apps/web-e2e/tests/real-price-hydration.spec.ts` 가 두 경로 모두에 대해 hydration warning 을 감시하고 있고, `apps/web-e2e/tests/real-price-compare.spec.ts` 가 비교 페이지 기본 동작을 덮고 있다.

## 변경 파일

- `apps/web/src/app/real-price/_lib/monthOptions.ts` `new Date()` 기반 월 옵션 생성 공통화
- `apps/web/src/app/real-price/_components/ChartLoadingState.tsx` 차트 dynamic import 용 공통 로딩 shell
- `apps/web/src/app/real-price/page.tsx`
- `apps/web/src/app/real-price/compare/page.tsx`
- `apps/web-e2e/tests/real-price-hydration.spec.ts`

## Phase별 구현 계획

### Phase 1 (완료): 공통 월 옵션/차트 shell 추출 (P0 prep, 커밋 단위)

- 변경 파일: `apps/web/src/app/real-price/_lib/monthOptions.ts`, `apps/web/src/app/real-price/_components/ChartLoadingState.tsx`
- 구현: `getMonthOptions()` / `buildMonthOptions()` 중복을 `buildRecentMonthOptions(referenceDate, count)` 같은 공유 함수로 정리하고, 차트 dynamic import 의 `loading` JSX 를 고정 높이 shell 로 분리한다.
- 선례: `apps/web/src/app/_components/monetize/ConsentBanner.tsx` 처럼 클라이언트 마운트 이후에만 브라우저 의존 UI 를 다루는 패턴을 참고한다.
- 테스트: 단위 테스트는 새 helper 가 있으면 추가하고, 이 단계에서는 `npx turbo lint` 로 타입/임포트 정합성만 확인한다.

### Phase 2 (완료): `/real-price` 첫 렌더 안정화 (커밋 단위)

- 의존성: Phase 1
- 변경 파일: `apps/web/src/app/real-price/page.tsx`, `apps/web-e2e/tests/real-price-hydration.spec.ts`
- 구현: `getMonthOptions()` 와 월별 `useEffect` 초기화 로직을 Phase 1 helper 로 교체하고, `dealYmd` / `trendFromMonth` / `trendToMonth` 의 첫 렌더가 서버와 동일하게 유지되도록 정리한다. `MonthlyPriceTrendChart` 와 `RealPriceCharts` 는 공통 shell 을 통해 마운트 전후 마크업 차이를 없앤다.
- 테스트: `/real-price` 에서 hydration warning 0건, 법적 고지 노출, 계약월/추이월 select 가 mount 후 정상 채워지는지 `apps/web-e2e/tests/real-price-hydration.spec.ts` 로 검증한다.

### Phase 3 (완료): `/real-price/compare` 첫 렌더 안정화 (커밋 단위)

- 의존성: Phase 1
- 변경 파일: `apps/web/src/app/real-price/compare/page.tsx`
- 구현: `buildMonthOptions()` 를 공유 helper 로 교체하고, `dealYmd` 초기값과 `RegionCompareCharts` 주변 shell 을 `/real-price` 와 동일한 방식으로 맞춘다. 지역 칩/테이블은 현재 상태를 유지하되, 첫 렌더에서 날짜 기반 상태가 추가로 계산되지 않게 한다.
- 테스트: `/real-price/compare` 에서 hydration warning 0건을 확인하고, 기존 compare smoke (`apps/web-e2e/tests/real-price-compare.spec.ts`) 가 그대로 통과하는지 본다.

## 테스트 계획

1. `npx turbo lint`
2. `npm test -w @zipath/web-e2e -- apps/web-e2e/tests/real-price-hydration.spec.ts`
3. `npm test -w @zipath/web-e2e -- apps/web-e2e/tests/real-price-compare.spec.ts`
