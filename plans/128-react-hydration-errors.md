# Plan #128 React 하이드레이션 오류 7건 수정

## 입력

- 이슈: `#128` 실거래가 조회 페이지 React hydration 에러 7건 수정
- 목표: 서버/클라이언트 초기 렌더 차이, 날짜/랜덤/브라우저 전용 API 사용 여부를 우선 점검하고 회귀 테스트를 추가
- 동일 배치 형제 이슈: `#127` `#132` `#129` `#122` `#123` `#131`
- 회의록: `/tmp/pm-meeting-36Gwg5` 는 현재 워크트리에 없으므로, 코드에서 직접 확인 가능한 렌더 불일치 후보를 기준으로 계획한다

## 현재 판단

- `apps/web/src/app/layout.tsx` 는 이미 `suppressHydrationWarning` 을 사용 중이므로 루트 `<html>`/`<body>` 는 우선순위가 낮다
- 실거래가 화면의 후보는 `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/real-price/compare/page.tsx`, `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`, `apps/web/src/app/real-price/_components/RealPriceCharts.tsx`, `apps/web/src/app/real-price/compare/_components/RegionCompareCharts.tsx`
- `new Date()` 기반 기본값, `toLocaleString()` 의 암묵적 로케일, 차트의 브라우저 전용 렌더 경로를 우선 의심한다
- `apps/web-e2e/tests/real-price-compare.spec.ts` 가 이미 있으므로, 여기에 hydration 회귀를 직접 잡는 테스트를 추가하는 편이 가장 효율적이다

## 범위

- 프론트엔드 전용: `apps/web`, `apps/web-e2e`
- TypeScript strict 유지, `any` 추가 금지
- 숫자/날짜 포맷은 서버와 브라우저에서 같은 문자열이 나와야 한다
- 법적 고지 문구(`참고용이며 법적 효력 없음`)는 유지

## Phase 1 (완료): 재현 지점 고정 및 회귀 테스트 뼈대

### 작업

- `apps/web-e2e/tests/real-price-compare.spec.ts` 를 기준으로 `/real-price/compare` 의 현재 상호작용을 유지한다
- 새 파일 `apps/web-e2e/tests/real-price-hydration.spec.ts` 를 추가해 `/real-price` 와 `/real-price/compare` 접속 시 console hydration warning/error 가 없는지 검증한다
- 필요 시 `page.on("console")` 또는 `page.on("pageerror")` 로 React hydration 메시지를 수집해 7건 재발을 막는다
- 코드 확인 포인트를 주석이나 테스트 설명에 남긴다

### 파일

- `apps/web-e2e/tests/real-price-compare.spec.ts`
- `apps/web-e2e/tests/real-price-hydration.spec.ts` `# 새로 추가`

### 선례 파일

- `apps/web-e2e/tests/header-nav.spec.ts`
- `apps/web-e2e/tests/health.spec.ts`

### 산출물

- hydration 에러를 직접 검출하는 e2e 회귀 테스트
- `/real-price` 와 `/real-price/compare` 의 현재 렌더 계약을 문서화한 테스트

## Phase 2 (완료): 날짜 기반 초기값을 첫 렌더에서 제거

### 작업

- `apps/web/src/app/real-price/page.tsx`
  - `getMonthOptions()` 의 `new Date()` 의존을 렌더 경로에서 끊는다
  - `dealYmd`, `trendFromMonth`, `trendToMonth`, `monthOptions` 의 첫 렌더를 비어 있는 상태로 고정하고, 마운트 이후 채운다
  - `viewMode === "trend"` 와 일반 조회 화면이 SSR/CSR 첫 렌더에서 동일한 placeholder DOM 을 유지하는지 확인한다

- `apps/web/src/app/real-price/compare/page.tsx`
  - `buildMonthOptions()` 와 `dealYmd` 기본값이 첫 렌더에서 고정되도록 유지하거나, 필요하면 공통 helper 로 분리한다
  - 선택 박스의 초기 value 와 disabled 상태가 서버/클라이언트에서 같게 유지되도록 정리한다

- 필요 시 새 helper 파일 `apps/web/src/app/real-price/_lib/monthOptions.ts` 를 만들어 month list 계산을 한 곳으로 모은다

### 파일

- `apps/web/src/app/real-price/page.tsx`
- `apps/web/src/app/real-price/compare/page.tsx`
- `apps/web/src/app/real-price/_lib/monthOptions.ts` `# 필요 시 신규`

### 선례 파일

- `apps/web/src/app/announcements/page.tsx`
- `apps/web/src/app/announcements/[id]/page.tsx`

### 산출물

- 서버와 클라이언트 첫 렌더가 같은 month select 초기 DOM
- `new Date()` 에 의한 초기 렌더 흔들림 제거

## Phase 3 (완료): 숫자/차트 렌더 안정화

### 작업

- `apps/web/src/app/real-price/compare/page.tsx`
  - 서버에서 렌더되는 텍스트가 있으면 `toLocaleString()` 의 암묵 로케일 의존을 제거한다
  - 가능한 경우 `Intl.NumberFormat("ko-KR")` 또는 공통 숫자 formatter 로 통일한다

- `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`
  - 차트 전체가 이미 client-only 라면 유지하되, summary table/label 텍스트가 서버에 노출되지 않는지 다시 확인한다

- `apps/web/src/app/real-price/_components/RealPriceCharts.tsx`
  - `toLocaleString()` 기반 tooltip/axis formatter 가 서버 렌더 경로로 새지 않도록 유지한다

- `apps/web/src/app/real-price/compare/_components/RegionCompareCharts.tsx`
  - `formatPrice()` 와 axis formatter 의 결과가 브라우저 기본 로케일에 흔들리지 않도록 고정한다

### 파일

- `apps/web/src/app/real-price/compare/page.tsx`
- `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`
- `apps/web/src/app/real-price/_components/RealPriceCharts.tsx`
- `apps/web/src/app/real-price/compare/_components/RegionCompareCharts.tsx`

### 선례 파일

- `apps/web/src/lib/dateFormat.ts`
- `apps/web/src/app/layout.tsx`

### 산출물

- 서버/클라이언트에서 같은 숫자 문자열을 내는 formatter
- 차트는 client-only 경계 안에서만 렌더

## Phase 4 (완료): 유닛 테스트 보강

### 작업

- month list 계산이나 숫자 formatter 를 helper 로 분리했다면, 해당 helper 에 대한 Jest 테스트를 추가한다
- 테스트는 고정된 입력값으로 같은 출력이 나오는지 검증하고, timezone/locale 의존성이 새지 않는지 확인한다
- 기존 `apps/web/src/lib/__tests__/api.test.ts` 스타일을 따라 작은 pure function 단위로 끊는다

### 파일

- `apps/web/src/app/real-price/_lib/monthOptions.test.ts` `# 필요 시 신규`
- `apps/web/src/app/real-price/_lib/formatNumber.test.ts` `# 필요 시 신규`
- `apps/web/src/lib/dateFormat.ts` `# helper 공유 시`

### 선례 파일

- `apps/web/src/contexts/authProfile.test.ts`
- `apps/web/src/lib/__tests__/api.test.ts`

### 산출물

- SSR/CSR 불일치 원인을 다시 만들기 어려운 순수 함수 회귀 테스트

## Phase 5 (완료): 최종 검증

### 작업

- `npm run test -w @zipath/web`
- `npm run test -w @zipath/web-e2e`
- `npm run lint -w @zipath/web`
- `npm run build -w @zipath/web`
- 가능하면 브라우저에서 `/real-price` 와 `/real-price/compare` 를 열어 hydration console 이 0건인지 확인

### 완료 기준

- `/real-price` 와 `/real-price/compare` 에서 React hydration warning/error 가 재현되지 않는다
- 날짜/월 선택 UI 의 첫 렌더가 서버와 클라이언트에서 일치한다
- 숫자 포맷이 로케일 차이로 흔들리지 않는다
- 회귀 테스트가 추가되어 같은 종류의 문제를 다시 잡을 수 있다
