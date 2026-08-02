# #128 `/real-price` 직접 접근 hydration 오류 재검증

- 플랜식별자: `C0255828`
- 출처: `#128`
- 관련 이슈: `#109` (일반 hydration 대응), `#106` (실거래가 지원 범위·법적 고지)

## 현재 구조 분석

- `apps/web/src/app/real-price/page.tsx` 및 `apps/web/src/app/real-price/compare/page.tsx`는 모두 Client Component다. 두 페이지는 첫 렌더에서 계약월과 월 옵션을 빈 값으로 두고, `useEffect` 안에서만 `buildRecentMonthOptions(new Date())`로 현재 월을 계산한다. 따라서 현재 소스의 SSR/CSR 최초 HTML은 날짜에 의존하지 않아야 한다.
- 공통 순수 함수 `apps/web/src/app/real-price/_lib/monthOptions.ts`의 `buildRecentMonthOptions()`는 고정 날짜 단위 테스트가 있으며, 두 페이지가 각각 동일한 mount 이후 초기화 패턴을 사용한다. 현재는 별도 월 상태 훅이나 서버 전달 초기값이 없다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts`는 `/real-price`와 `/real-price/compare` 직접 진입에서 console/pageerror의 `hydration`, React minified `#418/#423/#425`를 수집하고 계약월의 최종 값을 확인한다. 하지만 법적 고지 assertion이 hydration 및 계약월 결과보다 먼저 실행되므로, 배포본의 고지 누락이 React 검증 결과까지 가린다. 서버 document 원문도 검증하지 않아 SSR 최초 `<select>` 상태의 결정성은 고정하지 못한다.
- 배포 기본 URL(`https://zipath-web.vercel.app`)로 `npm test -w @zipath/web-e2e -- real-price-hydration`를 재실행한 결과, 두 경로 모두 `참고용이며 법적 효력 없음`을 찾지 못해 실패했다. 이는 현재 소스의 `page.tsx`/`compare/page.tsx`에 있는 고지와 배포본이 일치하지 않음을 뜻한다. 이 실패만으로 hydration 오류의 존재 여부를 단정하면 안 된다.
- 과거 #128 수정은 서버 wrapper와 Client Component 분리, 월 기본값 전달을 시도했지만 현재 `HEAD`에는 포함되지 않았다. 로컬 production build 재현이 현재의 mount-after-render 패턴에서 통과한다면 그 과거 구조를 되살리지 않는다.

## 변경 파일

- `apps/web-e2e/tests/real-price-hydration.spec.ts`
- `apps/web/src/app/real-price/page.tsx` (조건부)
- `apps/web/src/app/real-price/compare/page.tsx` (조건부)
- `apps/web/src/app/real-price/_lib/monthOptions.ts` (조건부)
- `apps/web/src/app/real-price/_lib/monthOptions.test.ts` (조건부)

## Phase별 구현 계획

### Phase 1: direct entry hydration 계약을 서버 HTML·클라이언트 결과로 분리

- 변경 파일: `apps/web-e2e/tests/real-price-hydration.spec.ts`
- 구현:
  - `collectHydrationIssues(page)`를 `page.goto()` 전에 계속 등록하고, `/real-price`, `/real-price/compare`별 document `Response` 원문을 수집한다.
  - 서버 응답 원문에서 `계약월` select가 날짜가 계산된 option/value가 아니라 빈 초기 상태(비활성 select와 `불러오는 중...` fallback)로 렌더됐는지 확인한다. 페이지별로 시작/종료월도 같은 규칙을 적용해 서버가 `new Date()` 결과를 최초 HTML에 섞지 않음을 고정한다.
  - navigation 뒤에는 heading, hydration message 0건, 그리고 mount 이후 `계약월`의 `YYYYMM` 값 순으로 확인한다. `page.waitForTimeout(500)` 대신 locator의 값 조건으로 대기해 시간 의존성을 없앤다.
  - 법적 고지는 마지막 assertion으로 유지하고, 실패 메시지/테스트명을 배포본 불일치로 구분 가능하게 만든다. 고지 누락이 발생해도 그보다 앞선 hydration·계약월 검증이 이미 수행되어 원인 분리가 가능해야 한다.
  - 선례: 현재 파일의 `HYDRATION_PATTERNS`, `collectHydrationIssues()` 및 `apps/web-e2e/tests/legal-disclaimer.spec.ts`의 문구 탐색 패턴.
- 테스트:
  - `npm run build -w @zipath/web`
  - build 산출물을 `next start`로 실행하고 `ZIPATH_BASE_URL=http://127.0.0.1:<port> npm test -w @zipath/web-e2e -- real-price-hydration`를 실행한다.
  - 기본 배포 URL에서도 같은 명령을 실행해 고지 assertion만 실패하는지 별도로 기록한다.

### Phase 2: 로컬 production 재현 실패 시 최초 월 상태의 단일 소스를 보강

- 의존성: Phase 1. 로컬 build 서버의 Phase 1 검증에서 React `#418/#423/#425`·hydration message 또는 서버 HTML/계약월 계약이 실패할 때만 수행한다. 통과하면 이 phase는 변경 없이 건너뛴다.
- 변경 파일: `apps/web/src/app/real-price/_lib/monthOptions.ts`, `apps/web/src/app/real-price/_lib/monthOptions.test.ts`, `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/real-price/compare/page.tsx`
- 구현:
  - `monthOptions.ts`에 두 페이지가 공유하는 빈 최초 월 상태 helper를 추가하고, `dealYmd`, `trendFromMonth`, `trendToMonth`, `monthOptions`의 첫 렌더 기준을 한 곳에 둔다.
  - `RealPricePage`와 `RegionComparePage`가 렌더 본문에서 `new Date()`나 월 options를 생성하지 않도록 유지하고, mount 이후 상태 전환만 공통 helper의 결과로 적용한다. `page.tsx`의 table/chart와 `compare/page.tsx`의 계약월 select가 같은 fallback DOM을 유지해야 한다.
  - `monthOptions.test.ts`에 빈 최초 상태와 고정 기준일의 options/default 선택값을 추가해 월 경계에서도 결정성을 검증한다.
  - 과거 `RealPriceClient`/`RegionCompareClient` 분리는 이 검증으로 해결되지 않을 때에만 검토한다. 현재 두 큰 페이지를 재분할하는 작업은 본 phase 범위에 넣지 않는다.
  - 선례: `buildRecentMonthOptions()`와 현재 두 page의 `useEffect` 초기화 블록.
- 테스트:
  - `npm test -w @zipath/web -- monthOptions`
  - Phase 1의 build된 로컬 서버 hydration E2E
  - `npm run build -w @zipath/web`

## 테스트 계획

1. production build를 만든 뒤 로컬 `next start`에서 `/real-price`와 `/real-price/compare`를 직접 열어 React `#418/#423/#425`와 일반 hydration 경고가 0건인지 확인한다.
2. 각 route의 document response가 날짜 비결정값 없이 동일한 pending month-select HTML을 제공하고, hydration 후 `계약월`이 `YYYYMM` 초기값으로 채워지는지 확인한다.
3. 배포 기본 URL에서는 법적 고지 assertion을 별도 배포 동기화 실패로 기록한다. 이 결과는 로컬 소스의 hydration 통과/실패와 혼동하지 않는다.
4. 조건부 소스 수정이 필요할 때만 `monthOptions` 단위 테스트와 웹 production build를 추가로 실행한다.

## 자체 검토

- 1회차: 기존 E2E의 assertion 순서 때문에 배포 고지 누락이 hydration 결과를 가리는 누락을 Phase 1에서 해소했다.
- 2회차: 소스 변경은 재현 실패에만 한정하고, 현재 결정적 mount-after-render 구조를 불필요하게 과거 구현으로 되돌리지 않도록 Phase 2를 조건부로 분리했다.
- 3회차: 각 phase는 최대 4개 파일이며, Phase 1은 테스트 계약 하나, Phase 2는 월 최초 상태 하나만 다룬다.
