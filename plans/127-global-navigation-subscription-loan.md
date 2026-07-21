# #127 청약·대출 페이지 글로벌 네비게이션 복구

- 플랜식별자: `674CA511`
- 출처: `#127`

## 현재 구조 분석

- `apps/web/src/components/layout/SiteHeader.tsx` 가 글로벌 네비게이션의 단일 소스다.
- `NAV_LINKS` 는 `청약 / 대출 / 체크리스트 / 실거래가` 4개 링크를 렌더링하고, 데스크톱 nav 와 모바일 메뉴가 같은 배열을 공유한다.
- `apps/web/src/app/subscription/page.tsx` 와 `apps/web/src/app/loan/page.tsx` 는 모두 `SiteHeader` 를 최상단에 렌더링한다.
- `apps/web/src/app/checklist/page.tsx` 와 `apps/web/src/app/real-price/page.tsx` 가 같은 페이지 쉘 패턴의 선례다.
- `apps/web/src/components/layout/SiteHeader.test.ts` 와 `apps/web-e2e/tests/header-nav.spec.ts` 가 현재 회귀 방지의 핵심 지점이다.

## 변경 파일

- `apps/web/src/components/layout/SiteHeader.test.ts`
- `apps/web-e2e/tests/header-nav.spec.ts`
- `apps/web/src/app/subscription/page.test.ts`
- `apps/web/src/app/loan/page.test.ts`

## Phase별 구현 계획

### Phase 1 (완료): 청약·대출 페이지 shell 정렬

- 구현:
  - `subscription` / `loan` 페이지는 이미 `SiteHeader` + `main` 구조를 사용하고 있으므로, page-level 렌더 테스트로 해당 구조를 고정한다.
  - 페이지 로컬의 로고-only 헤더, nav 복붙, 별도 disclaimer 회귀가 들어오면 테스트가 깨지도록 `SiteHeader` 출력과 글로벌 nav 링크 집합을 검증한다.
  - `apps/web/src/app/checklist/page.tsx` 와 `apps/web/src/app/real-price/page.tsx` 의 배치와 동일한 페이지 쉘 패턴을 유지한다.
- 테스트:
  - `npm test -w @zipath/web -- SiteHeader`
  - `npm test -w @zipath/web-e2e -- header-nav.spec.ts`

### Phase 2 (완료): 헤더 회귀 테스트 강화

- 의존성: Phase 1
- 변경 파일:
  - `apps/web/src/components/layout/SiteHeader.test.ts`
  - `apps/web-e2e/tests/header-nav.spec.ts`
  - `apps/web/src/app/subscription/page.test.ts`
  - `apps/web/src/app/loan/page.test.ts`
- 구현:
  - `SiteHeader.test.ts` 에서 글로벌 nav 4개 링크와 법적 고지가 유지되는지 렌더 단위로 고정한다.
  - `header-nav.spec.ts` 에서 `/subscription` 과 `/loan` 경로를 중심으로 nav 가 보이는지와 모바일 햄버거 토글이 동일 링크 집합을 노출하는지 고정한다.
  - `subscription/page.test.ts` 와 `loan/page.test.ts` 에서 페이지 단위로 공통 헤더와 법적 고지를 확인한다.
  - 테스트 설명은 이슈 #127 기준으로 유지해서, 페이지별 로고-only 헤더 회귀를 직접 드러내게 한다.
- 테스트:
  - `npm test -w @zipath/web -- SiteHeader`
  - `npm test -w @zipath/web-e2e -- header-nav.spec.ts`

## 테스트 계획

1. `npm test -w @zipath/web -- SiteHeader`
2. `npm test -w @zipath/web-e2e -- header-nav.spec.ts`
3. 필요 시 `npx turbo lint --filter=@zipath/web`
4. 필요 시 `npx turbo build --filter=@zipath/web`
