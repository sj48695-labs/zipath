## Plan #127 공통 헤더 정리 및 내비게이션 회귀 방지

- 플랜식별자: `1F44232D`
- 출처: `/plan 127`

### 지시사항 (원본 보존)

> #127: /subscription, /loan 페이지에서도 홈/real-price와 동일한 글로벌 네비게이션(청약·대출·체크리스트 링크)이 유지되도록 공통 헤더 사용 경로를 정리한다. 페이지별 로고-only 헤더가 남지 않도록 snapshot 또는 렌더 테스트를 보강한다.

### 현재 구조 분석

- `apps/web/src/components/layout/SiteHeader.tsx` 가 글로벌 헤더 단일 진입점이다.
- `apps/web/src/app/page.tsx`, `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/checklist/page.tsx`, `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/loan/page.tsx` 가 모두 `SiteHeader` 를 직접 렌더링한다.
- `apps/web/src/app/subscription/page.tsx` 와 `apps/web/src/app/loan/page.tsx` 에는 별도의 로고-only `<header>` 구현이 현재 보이지 않는다.
- `apps/web-e2e/tests/header-nav.spec.ts` 에는 이미 `/subscription`, `/loan`, `/checklist` 에 대한 nav 회귀 테스트가 있다.
- 이슈 요구는 새 기능 추가보다 `SiteHeader` 의 공통 내비게이션을 고정하고, 페이지별 헤더가 다시 들어오지 못하게 테스트를 강화하는 쪽에 가깝다.

### 변경 파일

- `apps/web/src/components/layout/SiteHeader.tsx`
- `apps/web/src/components/layout/SiteHeader.test.ts` `# 새로 추가`
- `apps/web/src/app/subscription/page.tsx`
- `apps/web/src/app/loan/page.tsx`
- `apps/web-e2e/tests/header-nav.spec.ts`

### Phase별 구현 계획

### Phase 1 (완료): 공통 헤더 경로 정리 및 페이지 소비부 고정

- 변경 파일: `apps/web/src/components/layout/SiteHeader.tsx`, `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/loan/page.tsx`
- 구현:
  - `/subscription` 과 `/loan` 이 `SiteHeader` 외의 로고-only 헤더 마크업을 갖지 않도록 정리한다.
  - 두 페이지의 헤더 소비 방식은 home / real-price / checklist 와 동일한 패턴으로 유지하고, 필요 시 `maxWidth` 만 페이지별로 조정한다.
  - `SiteHeader` 안의 네비게이션 링크 집합(`청약`, `대출`, `체크리스트`, `실거래가`) 이 단일 진실원천으로 남도록 한다.
- 테스트:
  - 변경 후 `/subscription` 과 `/loan` 에서 헤더 구조가 동일하게 유지되는지 E2E 기준으로 확인할 수 있게 다음 Phase 의 테스트와 연결한다.

### Phase 2 (완료): 렌더/E2E 회귀 테스트 추가

- 의존성: Phase 1
- 변경 파일: `apps/web/src/components/layout/SiteHeader.test.ts`, `apps/web-e2e/tests/header-nav.spec.ts`
- 구현:
  - `SiteHeader.test.ts` 에서 `renderToStaticMarkup` 기반 렌더 테스트를 추가해 로고 링크, 4개 nav 링크, 법적 고지 문구가 동시에 렌더링되는지 검증한다.
  - 기존 `header-nav.spec.ts` 는 `/subscription`, `/loan`, `/checklist` 에 대한 nav 검증을 유지하고, `/` 와 `/real-price` 도 같은 네비게이션 셋을 사용하는지 smoke coverage 로 확장한다.
  - 모바일 메뉴 토글 검증은 `/subscription` 과 `/loan` 에 유지해 이슈의 직접 대상 페이지를 계속 보호한다.
- 테스트:
  - `SiteHeader` 렌더 테스트가 nav 링크 누락과 로고-only 헤더 재도입을 잡는지 확인한다.
  - E2E 에서 각 페이지의 navigation role 에 동일한 링크가 노출되는지 확인한다.

## 테스트 계획

1. `npm test -w @zipath/web`
2. `npm test -w @zipath/web-e2e`
3. `npx turbo lint`
4. `npx turbo build`
