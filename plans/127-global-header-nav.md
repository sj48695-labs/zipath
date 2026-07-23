# #127 공통 헤더 경로 정리

- 플랜식별자: `3B3E8D0D`
- 출처: `#127`

## 현재 구조 분석

- `apps/web/src/app/page.tsx`, `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/loan/page.tsx` 모두 `SiteHeader`를 사용하고 있고, `SiteHeader` 자체가 청약·대출·체크리스트·실거래가 글로벌 네비게이션을 렌더링한다.
- `apps/web-e2e/tests/header-nav.spec.ts`는 이미 `/subscription`과 `/loan`을 포함해 헤더 nav 와 법적 고지를 확인하고 있다.
- 이번 이슈의 핵심은 새 헤더를 만드는 것이 아니라, `/subscription`과 `/loan`이 홈/real-price와 같은 공통 헤더 경로를 계속 타도록 고정하고 page-level 회귀를 막는 것이다.

## 변경 파일

- `apps/web/src/app/subscription/page.tsx`
- `apps/web/src/app/loan/page.tsx`
- `apps/web/src/app/subscription/page.test.ts`
- `apps/web/src/app/loan/page.test.ts`
- `apps/web-e2e/tests/header-nav.spec.ts`

## Phase별 구현 계획

### Phase 1 (완료): `/subscription`과 `/loan`의 공통 헤더 경로 정리

- 변경 파일: `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/loan/page.tsx`
- 구현: 두 페이지가 `SiteHeader`만 사용하도록 유지/정리하고, page-local logo-only header 가 남아 있으면 제거한다. `apps/web/src/app/page.tsx` 와 `apps/web/src/app/real-price/page.tsx` 의 `SiteHeader maxWidth="max-w-5xl"` 사용을 선례로 맞춘다.
- 테스트: `npm test -w @zipath/web -- src/components/layout/SiteHeader.test.ts` 와 `npm test -w @zipath/web-e2e -- tests/header-nav.spec.ts` 로 기존 헤더 계약이 깨지지 않는지 확인한다.

### Phase 2 (완료): `/subscription`·`/loan` 렌더 회귀 테스트 추가

- 의존성: Phase 1
- 변경 파일: `apps/web/src/app/subscription/page.test.ts`, `apps/web/src/app/loan/page.test.ts`
- 구현: `SiteHeader.test.ts` 의 `renderToStaticMarkup` 패턴을 따라 각 페이지를 렌더링하고, 글로벌 네비 링크(`청약`, `대출`, `체크리스트`, `실거래가`)와 법적 고지가 실제 페이지 마크업에 포함되는지 확인한다. `next/link` 와 `NotificationBell` 은 `SiteHeader.test.ts` 와 같은 방식으로 mock 한다.
- 테스트: `npm test -w @zipath/web -- src/app/subscription/page.test.ts src/app/loan/page.test.ts` 로 두 신규 렌더 테스트를 실행한다.

## 테스트 계획

1. `apps/web/src/components/layout/SiteHeader.test.ts` 로 공통 헤더 계약을 먼저 확인한다.
2. `apps/web-e2e/tests/header-nav.spec.ts` 로 `/subscription`, `/loan`, `/`, `/real-price`, `/real-price/compare`, `/checklist` 의 nav 노출을 유지한다.
3. `apps/web/src/app/subscription/page.test.ts`, `apps/web/src/app/loan/page.test.ts` 로 페이지 단위 렌더 계약을 고정한다.
