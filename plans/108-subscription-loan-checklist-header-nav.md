## Plan #108 /subscription·/loan·/checklist 페이지 헤더 내비게이션 링크 누락 수정

- 플랜식별자: `B0EACD3E`
- 출처: GitHub Issue #108 (https://github.com/sj48695-labs/zipath/issues/108)

### 지시사항 (원본 보존)

> 재현/현상: https://zipath-web.vercel.app/subscription, /loan, /checklist 접속 시 헤더에 "청약", "대출", "체크리스트" 네비게이션 링크가 표시되지 않고 로고(Zipath)만 보임. 반면 /real-price, /announcements, /real-price/compare 에서는 nav 정상 표시.
> 기대: 모든 페이지에서 헤더 nav 링크가 일관되게 표시되어 다른 섹션으로 이동 가능해야 함.
> 근거: snapshot — /subscription banner: `link "Zipath"` 만 존재, navigation 요소 없음. /real-price banner: `link "Zipath"` + `navigation` 모두 존재.

### 결정 사항 (Q&A)

- **Q. 왜 페이지마다 헤더가 다른가?**
  A. 루트 레이아웃(`apps/web/src/app/layout.tsx`)은 헤더를 포함하지 않고, 각 페이지가 헤더를 직접 복붙으로 인라인 구현함. `/subscription`, `/loan`, `/checklist` 페이지는 로고만 있고 `<nav>` 자체가 누락됨. (`apps/web/src/components/layout/Header.tsx` 공용 컴포넌트가 존재하나 어디에서도 import 되지 않고 링크 구성도 불일치)

- **Q. 단순히 3개 페이지에 nav를 복붙 추가할 것인가, 공용 컴포넌트로 통합할 것인가?**
  A. 공용 컴포넌트로 통합한다. 현재 ~15개 페이지에 헤더가 중복되어 있고 폭(`max-w-3xl/4xl/5xl`)과 링크 구성이 제각각이라 재발 위험이 큼. 단일 `SiteHeader`로 통합해 근본 원인을 제거한다.

- **Q. 페이지별 콘텐츠 폭이 다른데 헤더 폭은 어떻게 맞추나?**
  A. `SiteHeader`에 `maxWidth` prop(기본 `max-w-5xl`)을 두어 각 페이지의 기존 `<main>` 폭과 일치시킨다. 헤더 폭은 시각적 정렬 목적이므로 페이지별 기존 값 유지.

- **Q. 내비게이션 링크 구성은?**
  A. 청약(`/subscription`), 대출(`/loan`), 체크리스트(`/checklist`), 실거래가(`/real-price`) + 알림종(`NotificationBell`). 홈/실거래가/공고 등 정상 페이지의 합집합 기준으로 통일. (기존 `/real-price`·`/announcements` 헤더에 없던 실거래가 링크 포함 — 어디서든 전 섹션 이동 가능해야 한다는 이슈 기대치 충족)

- **Q. 테스트는 어떻게?**
  A. `apps/web`의 jest는 `*.test.ts`(node env)만 매칭하여 컴포넌트/DOM 렌더 테스트 미지원. nav 렌더 검증은 Playwright e2e(`apps/web-e2e`)가 적합. 신규 spec으로 3개 경로의 nav 링크 표시를 검증한다.

- **Q. 미사용 `Header.tsx`는?**
  A. 링크 구성이 불일치하고 미사용이므로 신규 `SiteHeader`로 대체하고 기존 `Header.tsx`는 삭제한다.

### 구현 단계 (Phase)

1. [ ] **Phase 1: 공용 `SiteHeader` 컴포넌트 신설** — 파일: `apps/web/src/components/layout/SiteHeader.tsx`(신규), `apps/web/src/components/layout/Header.tsx`(삭제). 구현: 로고(`/` 링크) + nav(청약/대출/체크리스트/실거래가) + `NotificationBell`을 포함하는 client 컴포넌트. `maxWidth?: string`(기본 `"max-w-5xl"`) prop으로 컨테이너 폭 제어. 기존 `NotificationBell`(`apps/web/src/app/_components/NotificationBell.tsx`) 재사용. 미사용·불일치 `Header.tsx` 삭제. 커밋: `feat(web): #108 공용 SiteHeader 컴포넌트 추가`

2. [ ] **Phase 2: 버그 대상 3개 페이지에 SiteHeader 적용** — 파일: `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/loan/page.tsx`, `apps/web/src/app/checklist/page.tsx`. 구현: 각 페이지의 인라인 `<header>…</header>` 블록을 `<SiteHeader maxWidth="max-w-3xl" />`로 교체(세 페이지 모두 기존 `max-w-3xl` 유지). 이슈에서 지적된 nav 누락 직접 해결. 커밋: `fix(web): #108 청약/대출/체크리스트 페이지 헤더 nav 복구`

3. [ ] **Phase 3: 나머지 페이지 헤더 SiteHeader로 통합** — 파일: `apps/web/src/app/page.tsx`(max-w-5xl), `real-price/page.tsx`(5xl), `real-price/compare/page.tsx`(5xl), `announcements/page.tsx`(5xl), `announcements/[id]/page.tsx`(5xl), `checklist/[type]/page.tsx`(3xl, "체크리스트로" 뒤로가기 링크는 페이지에 잔존 가능), `contract/page.tsx`(4xl), `registry/page.tsx`(4xl), `glossary/page.tsx`(5xl), `notifications/page.tsx`(4xl), `login/page.tsx`(5xl), `profile/page.tsx`(5xl). 구현: 각 인라인 헤더를 페이지 기존 폭에 맞춘 `<SiteHeader maxWidth=… />`로 교체. 중복 제거 및 전 페이지 nav 일관성 확보. 커밋: `refactor(web): #108 전 페이지 헤더 SiteHeader로 통합`

4. [ ] **Phase 4: nav 표시 e2e 테스트 추가** — 파일: `apps/web-e2e/tests/header-nav.spec.ts`(신규). 구현: `/subscription`, `/loan`, `/checklist` 각 경로에서 `navigation` role 및 "청약"/"대출"/"체크리스트" 링크가 보이는지 `expect(...).toBeVisible()`로 검증(기존 `real-price-compare.spec.ts` 패턴 준용). 회귀 방지. 커밋: `test(web): #108 헤더 nav 표시 e2e 추가`

### 영향 범위

- **신규**: `apps/web/src/components/layout/SiteHeader.tsx`, `apps/web-e2e/tests/header-nav.spec.ts`
- **삭제**: `apps/web/src/components/layout/Header.tsx`
- **수정(헤더 교체)**: `apps/web/src/app/` 하위 page.tsx 15개 — subscription, loan, checklist, checklist/[type], page(home), real-price, real-price/compare, announcements, announcements/[id], contract, registry, glossary, notifications, login, profile
- 라우팅/데이터 로직 변경 없음. 순수 프레젠테이션 헤더 통합.
- "참고용이며 법적 효력 없음" 고지 영향 없음(헤더 외 영역).

### 테스트 계획

- **e2e (신규, Phase 4)**: `npm test -w @zipath/web-e2e` — `/subscription`·`/loan`·`/checklist`에서 nav 링크 표시 검증. 환경변수 `ZIPATH_BASE_URL`로 배포본 또는 로컬 대상.
- **기존 e2e 회귀**: `real-price-compare.spec.ts`, `health.spec.ts` 통과 유지.
- **빌드/린트**: `npx turbo build`, `npx turbo lint`로 타입·린트 무결성 확인(`apps/web` 컴포넌트 변경 컴파일 검증).
- **수동 확인**: 3개 경로에서 nav 4개 링크 + 알림종(로그인 시) 표시, 헤더 폭이 본문 폭과 정렬되는지 시각 확인.
