# #91 React 하이드레이션 오류 8건 수정 계획

## 입력

- 이슈: #91 React 하이드레이션 오류 8건 수정
- 브랜치: `91-react-hydration-errors`
- 우선 확인 경로: `apps/web/src/app/real-price/compare/page.tsx`
- 동일 배치 형제 이슈: #92 #93 #94 #96 #95
- 회의록: `/tmp/pm-meeting-eL40Vh`는 현재 워크트리에 없음

## 목표

SSR 결과와 첫 CSR 렌더 결과가 달라지는 원인을 제거한다. 주요 원인은 `window`/스토리지 직접 접근, `new Date()` 및 locale formatting, Recharts 같은 브라우저 의존 렌더링, `useEffect` 외부에서 계산되는 동적 초기값이다.

## 범위

- 프론트엔드만 수정: `apps/web`
- TypeScript strict 유지, `any` 사용 금지
- 기존 `useIsClient` 패턴 우선 사용
- 브라우저 의존 차트는 필요한 경우 `next/dynamic`의 `ssr: false` 적용
- 법적 고지 문구는 유지

## 확인된 후보

1. `apps/web/src/app/real-price/compare/page.tsx`
   - `getMonthOptions()`가 `new Date()`에 의존한다.
   - 현재 `useIsClient`로 월 목록 렌더는 방어되어 있으나, `useEffect` 기본값 세팅과 차트 렌더까지 검증이 필요하다.
   - Recharts import가 클라이언트 컴포넌트 최상단에 있어 SSR 시 차트 DOM 불일치 가능성이 있다.

2. `apps/web/src/app/real-price/page.tsx`
   - `useState(() => getMonthOptions()[0].value)`, `useState(() => getMonthOptions()[5].value)`, 렌더 중 `const monthOptions = getMonthOptions()`가 모두 현재 날짜에 의존한다.
   - 월 경계나 서버/클라이언트 timezone 차이에서 hydration mismatch 가능성이 높다.
   - Recharts 직접 import가 있다.

3. `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`
   - Recharts 기반 차트 렌더링 컴포넌트다.
   - 부모에서 dynamic import로 분리하거나 컴포넌트 자체를 client-only wrapper로 감싸는 방식 검토가 필요하다.

4. `apps/web/src/app/announcements/page.tsx`
   - `isActive(endDate)`가 렌더 중 `new Date()`를 호출해 접수중/마감 배지가 시점에 따라 달라진다.
   - `formatDate()`가 로컬 timezone에 의존한다.

5. `apps/web/src/app/announcements/[id]/page.tsx`
   - `isActive(endDate)`가 렌더 중 `new Date()`를 호출한다.
   - `formatDate()`가 로컬 timezone에 의존한다.

6. `apps/web/src/app/notifications/page.tsx`
   - `formatDate()`가 `toLocaleDateString("ko-KR", ...)`를 사용한다.
   - 알림 읽음 처리의 `new Date().toISOString()`은 이벤트 핸들러 내부라 hydration 직접 원인은 아니지만, 표시 포맷은 고정화가 필요하다.

7. `apps/web/src/app/profile/page.tsx`
   - `formatDate()`, `formatDateTime()`이 `toLocaleDateString("ko-KR", ...)`를 사용한다.
   - 인증 상태 로딩 이후 렌더라 위험은 낮지만 locale/timezone 고정이 안전하다.

8. `apps/web/src/lib/api.ts`, `apps/web/src/contexts/AuthContext.tsx`, `apps/web/src/app/login/page.tsx`
   - `window`/`localStorage` 사용은 대체로 함수·effect·이벤트 경로에 있어 직접 hydration 원인은 낮다.
   - SSR 렌더 중 호출되는 경로가 없는지 최종 점검한다.

## Phase 1: 재현 지점 고정

### 작업

- `rg`로 `window`, `localStorage`, `new Date`, `toLocale*`, `Intl`, Recharts 사용 위치를 다시 목록화한다.
- `/real-price/compare`, `/real-price`, `/announcements`, `/announcements/[id]`, `/notifications`, `/profile` 순서로 hydration 후보를 확인한다.
- `apps/web/app/...` 요청 경로가 실제로는 `apps/web/src/app/...`임을 구현 기록에 남긴다.

### 테스트 시나리오

- `npm run build -w @zipath/web`
- 빌드 로그에서 hydration 관련 warning, server/client dynamic import 오류, TypeScript 오류가 없는지 확인한다.

## Phase 2: 실거래가 비교/조회 화면 수정

### 작업

- `apps/web/src/app/real-price/compare/page.tsx`
  - 월 옵션과 기본 `dealYmd`를 마운트 이후에만 계산하는 현재 패턴을 유지하되, 첫 렌더 placeholder가 안정적인지 검증한다.
  - Recharts 영역은 별도 client-only 컴포넌트 또는 `dynamic(..., { ssr: false })`로 분리한다.

- `apps/web/src/app/real-price/page.tsx`
  - `dealYmd`, `trendFromMonth`, `trendToMonth`, `monthOptions`의 `getMonthOptions()` 호출을 SSR 첫 렌더에서 제거한다.
  - `useIsClient` 또는 `useEffect` 세팅으로 첫 렌더는 빈 월 목록/비활성 조회 상태를 렌더하고, 마운트 이후 기본 월을 채운다.
  - Recharts 기반 차트 영역을 client-only로 분리한다.

- `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`
  - 부모 dynamic import로 해결할지, 내부에서 chart body만 분리할지 결정한다.
  - 로딩/빈 상태는 SSR과 CSR 첫 렌더가 같은 정적 DOM을 유지하게 한다.

### 테스트 시나리오

- `/real-price/compare` 최초 진입 시 월 선택값이 마운트 이후 채워지고 console hydration error가 없어야 한다.
- `/real-price` 최초 진입 시 기본 월/추이 기간이 채워지고 조회 버튼 동작이 유지되어야 한다.
- `npm run build -w @zipath/web`

## Phase 3: 날짜/locale 렌더 안정화

### 작업

- 공통 날짜 formatter를 `apps/web/src/lib/dateFormat.ts`에 추가한다.
  - `YYYY.MM.DD`
  - `YYYY년 M월 D일`
  - `YYYY년 M월 D일 HH:mm`
  - 입력이 없거나 invalid면 `-` 반환
  - timezone은 명시적으로 고정한다. 날짜만 필요한 값은 UTC 기준 문자열 파싱을 우선 검토한다.

- 다음 파일의 직접 formatter를 공통 유틸로 교체한다.
  - `apps/web/src/app/announcements/page.tsx`
  - `apps/web/src/app/announcements/[id]/page.tsx`
  - `apps/web/src/app/notifications/page.tsx`
  - `apps/web/src/app/profile/page.tsx`

- `isActive(endDate)`는 렌더 중 `new Date()` 호출을 피한다.
  - 목록/상세 데이터 fetch 완료 후 `today` 기준값을 state로 1회 세팅하거나, 서버가 내려준 상태가 있다면 그 값을 사용한다.
  - 첫 렌더에서는 배지 DOM이 흔들리지 않도록 loading 이후에만 계산된 값을 렌더한다.

### 테스트 시나리오

- 날짜가 있는 공고 목록/상세에서 같은 입력값이 항상 같은 문자열로 표시되어야 한다.
- 마감/접수중 배지가 hydration 이후 뒤집히지 않아야 한다.
- `npm run build -w @zipath/web`

## Phase 4: 브라우저 API 사용 경로 점검

### 작업

- `apps/web/src/lib/api.ts`
  - `fetchApi()`의 `localStorage` 접근이 브라우저 이벤트/effect 경로에서만 호출되는지 확인한다.
  - 필요 시 `getAccessToken()` 같은 작은 함수로 분리해 SSR 경로에서는 null을 반환하게 한다.

- `apps/web/src/contexts/AuthContext.tsx`
  - 초기 `isLoading: true`와 `useEffect(fetchProfile)` 패턴이 SSR/CSR 첫 렌더를 동일하게 유지하는지 확인한다.
  - `setStoredToken`/`removeStoredToken`이 이벤트/effect 외부에서 호출되지 않는지 확인한다.

- `apps/web/src/app/login/page.tsx`
  - `window.location.href`가 click handler 내부에만 있어 유지 가능하다.

### 테스트 시나리오

- 로그아웃 상태에서 `/notifications`, `/profile` 첫 진입 시 hydration error 없이 로그인 필요 화면이 표시되어야 한다.
- 로그인 버튼 클릭 시 OAuth redirect URL 생성이 기존과 같아야 한다.

## Phase 5: 검증 및 회귀 확인

### 작업

- 전체 hydration 후보 재검색으로 직접 `new Date()`/`toLocale*`/Recharts SSR import 잔여를 확인한다.
- 웹 빌드와 가능하면 lint를 실행한다.
- 프로젝트 `/plan` 지침의 기본 테스트도 확인하되, 이번 변경은 웹 전용이므로 API 테스트는 변경 영향 없음으로 기록한다.

### 테스트 시나리오

- `npm run build -w @zipath/web`
- `npm run lint -w @zipath/web`
- 필요 시 `npx turbo build`
- API 변경이 없음을 확인하고, 요구 시 `npm test -w @zipath/api` 실행

## 완료 기준

- hydration warning 원인 8건이 코드상 제거 또는 안전 경로로 분류되어 기록된다.
- `/real-price/compare`와 `/real-price`가 SSR 첫 렌더에서 현재 날짜 기반 DOM을 만들지 않는다.
- Recharts 렌더링은 SSR과 분리되거나 첫 렌더 안정성이 보장된다.
- 날짜/locale 문자열은 서버/클라이언트 환경 차이에 흔들리지 않는다.
- `any` 타입을 추가하지 않는다.
- 커밋은 자동 생성하지 않는다. 커밋이 필요하면 별도 확인 후 진행한다.
