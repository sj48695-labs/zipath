# #128 운영 실거래가 React 하이드레이션 검증

- 플랜식별자: `C5DD56F9`
- 출처: `#128`

## 현재 구조 분석

- `apps/web/src/app/real-price/page.tsx`의 `RealPricePage`와
  `apps/web/src/app/real-price/compare/page.tsx`의 `RegionComparePage`는 모두
  `dealYmd`와 `monthOptions`를 빈 값으로 초기화한다. 각 컴포넌트의 마운트
  `useEffect`에서만 `buildRecentMonthOptions(new Date())`를 호출해 계약월 값을
  채운다. 따라서 날짜 의존 값이 서버 HTML에 들어가지 않아 SSR/CSR 불일치를
  피한다.
- 공통 월 생성 로직은 `apps/web/src/app/real-price/_lib/monthOptions.ts`의
  `buildRecentMonthOptions()`에 있으며, 두 페이지의 초기 계약월 `<select>`는
  비활성화된 `불러오는 중...` 옵션을 동일하게 렌더링한다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts`의 두 경로 테이블은 운영
  기본 URL(`apps/web-e2e/playwright.config.ts`의
  `https://zipath-web.vercel.app`)에서 `/real-price`와 `/real-price/compare`의
  서버 HTML 초기 상태, 마운트 후 계약월 값, 콘솔/페이지 오류를 함께 검증한다.
  React #418/#423/#425와 일반 hydration 오류는 `HYDRATION_PATTERNS`로 수집한다.
- 해당 초기화와 계약 테스트는 이미 `develop`에 병합되어 있다
  (`8dcee4a`, `62d3c02`). PM 지침에 따라 운영 계약이 통과하면 코드 재작업은
  하지 않고 이슈를 종료한다.

## 변경 파일

- 없음 — 운영 계약이 통과하는 경우 소스·테스트 변경 없이 이슈를 종료한다.

## Phase별 구현 계획

### Phase 1: 운영 hydration 계약 확인 (코드 변경 없음)

- 변경 파일: 없음.
- 실행: `npm test -w @zipath/web-e2e -- real-price-hydration.spec.ts`를
  `ZIPATH_BASE_URL` 기본값 대상으로 실행한다. 선례·계약 파일은
  `apps/web-e2e/tests/real-price-hydration.spec.ts`의
  `collectHydrationIssues()`, `expectPendingMonthSelect()`, `routes`이다.
- 검증: 각 경로가 4xx 미만으로 응답하고, 서버 HTML의 계약월 `<select>`가
  `disabled`, 빈 값, `불러오는 중...` 상태인지 확인한다. 하이드레이션 뒤에는
  계약월이 `YYYYMM` 값으로 바뀌고, React #418/#423/#425 및 hydration 관련
  console/pageerror가 없어야 한다.
- 완료 기준: 두 경로가 모두 통과하면 이슈를 코드 변경·추가 커밋 없이 종료한다.
  계약이 실패할 때에만 실패한 경로의 초기 상태와 오류를 근거로 별도 수정 phase를
  추가한다.

## 테스트 계획

1. 운영 기본 URL에서 `apps/web-e2e/tests/real-price-hydration.spec.ts`를 실행한다.
2. sandbox가 Chromium 실행을 제한하면, 브라우저 실행이 가능한 CI 또는 로컬
   환경에서 같은 명령을 재실행한다. 이 인프라 제한은 제품 회귀로 판단하지 않는다.
3. 통과 시 소스 변경 없이 #128을 종료하고, 실패 시 수집된 오류 메시지와 경로를
   기반으로 후속 수정 계획을 보강한다.
