# #127 글로벌 헤더 nav 회귀 방지

- 플랜식별자: `13FD2A55`
- 출처: `#127`

## 현재 구조 분석

- `apps/web/src/components/layout/SiteHeader.tsx` 가 글로벌 헤더의 단일 진입점이다.
- `SiteHeader` 는 로고 링크, 4개 글로벌 nav 링크(`청약`, `대출`, `체크리스트`, `실거래가`), 모바일 햄버거 메뉴, 그리고 법적 고지 문구를 함께 렌더링한다.
- `apps/web/src/app/page.tsx`, `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/checklist/page.tsx`, `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/loan/page.tsx` 가 모두 `SiteHeader` 를 직접 사용한다.
- `apps/web-e2e/tests/header-nav.spec.ts` 는 이미 주요 경로에서 nav 노출, 법적 고지, `/subscription` 및 `/loan` 의 모바일 메뉴 토글을 확인한다.
- 남은 리스크는 페이지 컴포넌트 쪽에서 로고-only 헤더나 다른 헤더 래퍼가 다시 들어오는 경우인데, 현재는 페이지 단위 렌더 계약 테스트가 부족하다.

## 변경 파일

- `apps/web/src/app/subscription/page.test.ts`
- `apps/web/src/app/loan/page.test.ts`

## Phase별 구현 계획

### Phase 1: `/subscription` 과 `/loan` 페이지 렌더 계약 고정

- 변경 파일: `apps/web/src/app/subscription/page.test.ts`, `apps/web/src/app/loan/page.test.ts`
- 구현:
  - `SiteHeader.test.ts` 의 `renderToStaticMarkup` 패턴을 그대로 따라, 각 페이지가 공통 헤더를 그대로 포함하는지 확인한다.
  - `next/link` 와 `NotificationBell` 은 `apps/web/src/components/layout/SiteHeader.test.ts` 의 mock 방식을 재사용한다.
  - 각 테스트에서 `청약`, `대출`, `체크리스트`, `실거래가` 링크와 `참고용이며 법적 효력 없음` 문구가 페이지 마크업에 포함되는지 검증한다.
  - 선례 파일: `apps/web/src/components/layout/SiteHeader.test.ts`
- 테스트:
  - `npm test -w @zipath/web -- src/app/subscription/page.test.ts src/app/loan/page.test.ts`
  - `npm test -w @zipath/web-e2e -- tests/header-nav.spec.ts`

## 테스트 계획

1. `apps/web/src/components/layout/SiteHeader.test.ts` 로 공통 헤더 계약을 선행 확인한다.
2. `apps/web/src/app/subscription/page.test.ts`, `apps/web/src/app/loan/page.test.ts` 로 페이지 단위 렌더 계약을 고정한다.
3. `apps/web-e2e/tests/header-nav.spec.ts` 로 실제 브라우저 경로에서 nav/법적 고지/모바일 메뉴가 유지되는지 확인한다.
