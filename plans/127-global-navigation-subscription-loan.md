## Plan #127 청약·대출 페이지 글로벌 네비게이션 복구

- 플랜식별자: `C8E4A21F`
- 출처: GitHub Issue #127 + PM 구현 지침
- 동일 배치 형제 이슈: `#128 #123 #131`

### 지시사항 (원본 보존)

> #127: 청약·대출 페이지 글로벌 네비게이션 바 누락 수정. 기존 공통 레이아웃/네비게이션 컴포넌트 패턴을 재사용하고, 페이지별 중복 구현은 피한다.

회의록 원문:
> `/tmp/pm-meeting-UxnfL6` (로컬 경로, 필요 시 확인)

### 최신 코드 조사 결과

- `apps/web/src/app/subscription/page.tsx` 와 `apps/web/src/app/loan/page.tsx` 는 둘 다 이미 `SiteHeader` 를 최상단에 렌더링한다.
- 공통 Nav 소스는 `apps/web/src/components/layout/SiteHeader.tsx` 의 `NAV_LINKS` 이며, desktop nav 와 mobile menu 가 같은 링크 집합을 공유한다.
- `apps/web-e2e/tests/header-nav.spec.ts` 에는 `/subscription`, `/loan`, `/checklist` 에서 nav 표시를 검증하는 회귀 테스트가 이미 있다.
- 따라서 이 이슈는 새 nav 컴포넌트를 만드는 문제가 아니라, 페이지 shell 이 공통 `SiteHeader` 를 유지하는지와 회귀 테스트가 계속 유효한지 확인하는 문제로 본다.

### 결정 사항 (Q&A)

| 질문 | 결정 |
|------|------|
| 공통 Nav의 단일 소스는 어디인가? | `apps/web/src/components/layout/SiteHeader.tsx` 의 `NAV_LINKS` 와 `NotificationBell` 조합을 단일 소스로 유지한다. |
| `subscription` / `loan` 페이지에 새 Nav를 만들까? | 금지. 페이지별 중복 구현 없이 기존 `SiteHeader` 만 사용한다. |
| 레이아웃 공유가 더 필요하면? | 먼저 페이지 shell 정리로 해결하고, 반복이 남을 때만 공통 shell 추출을 검토한다. |
| 테스트는 어디를 강화하나? | 기존 Playwright 회귀 테스트 `apps/web-e2e/tests/header-nav.spec.ts` 를 기준으로 `/subscription` 과 `/loan` 에서 nav 노출이 깨지지 않는지 고정한다. |

### 구현 단계 (Phase)

1. [x] **Phase 1: 청약·대출 페이지 shell 정렬**
   - 파일:
     - `apps/web/src/app/subscription/page.tsx`
     - `apps/web/src/app/loan/page.tsx`
   - 구현:
     - 두 페이지의 최상단 구조를 `checklist/page.tsx` / `real-price/page.tsx` 와 같은 패턴으로 맞춘다.
     - `SiteHeader` 가 페이지 첫 시각 요소로 항상 렌더되도록 유지한다.
     - 페이지 로컬에서 nav/header 를 별도 구현한 코드가 있으면 제거하고 `SiteHeader` 만 남긴다.
   - 선례:
     - `apps/web/src/app/checklist/page.tsx`
     - `apps/web/src/app/real-price/page.tsx`
   - 커밋:
     - `fix(web): #127 청약·대출 페이지에 공통 헤더 적용`

2. [x] **Phase 2: 공통 Nav 소스 단일화 점검**
   - 파일:
     - `apps/web/src/components/layout/SiteHeader.tsx`
   - 구현:
     - `NAV_LINKS` 를 유지하면서 `/subscription`, `/loan`, `/checklist`, `/real-price` 링크가 항상 동일한 순서와 라벨로 노출되는지 확인한다.
     - 모바일 메뉴(`menuOpen`) 와 desktop nav 가 같은 링크 집합을 바라보도록 유지한다.
     - 여기서 새 컴포넌트를 추가하지 않는다. 필요 시 기존 `SiteHeader` 내부만 정리한다.
   - 선례:
     - `apps/web/src/components/layout/SiteHeader.tsx`
   - 커밋:
     - `refactor(web): #127 공통 네비게이션 소스 정리`

3. [x] **Phase 3: 회귀 테스트 보강**
   - 파일:
     - `apps/web-e2e/tests/header-nav.spec.ts`
   - 구현:
     - `/subscription`, `/loan` 에서 `nav` 가 visible 인지와 링크 4개가 보이는지 재확인한다.
     - 모바일 뷰포트에서는 햄버거 메뉴를 열었을 때 동일 링크 세트가 노출되는지 확인한다.
     - 테스트 설명 주석은 이슈 #127 기준으로 유지한다.
   - 커밋:
     - `test(web): #127 헤더 nav 회귀 테스트 보강`

4. [x] **Phase 4: 검증**
   - 실행:
     - `npx turbo lint`
     - `npx turbo build`
     - `npm test -w @zipath/api`
     - `npm test -w @zipath/web-e2e -- --grep 'subscription|loan'`
   - 통과 기준:
     - 웹 lint/build 통과
     - `header-nav.spec.ts` 는 일반 브라우저 환경에서 재실행 가능
     - `/subscription` 과 `/loan` 에서 데스크톱/모바일 모두 nav 링크가 보이는 상태 유지
   - 커밋:
     - 검증 전용 커밋 없음

### 영향 범위

- 프론트엔드 전용: `apps/web`
- 핵심 수정 후보:
  - `apps/web/src/app/subscription/page.tsx`
  - `apps/web/src/app/loan/page.tsx`
  - `apps/web/src/components/layout/SiteHeader.tsx`
  - `apps/web-e2e/tests/header-nav.spec.ts`
- 공통 정책:
  - `SiteHeader` 를 단일 진입점으로 유지
  - 페이지별 nav 복붙 금지
  - `any` 금지, TypeScript strict 유지

### 테스트 계획

- `npm test -w @zipath/web-e2e`
- `npx turbo lint --filter=@zipath/web`
- `npx turbo build --filter=@zipath/web`
- 수동 확인 시나리오:
  - `/subscription`
  - `/loan`
  - 데스크톱: 상단 nav 4개 링크 표시
  - 모바일: 햄버거 메뉴 열기 후 동일 링크 표시
