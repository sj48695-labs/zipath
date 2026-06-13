## Plan #109 /real-price 및 /real-price/compare React 하이드레이션 오류 7~8건 (#418/#423/#425)

- 플랜식별자: `B3F1A2C7`
- 출처: GitHub Issue #109 (이슈 #91/#97, #103/#112에 이은 3번째 동일 증상 재보고)

### 지시사항 (원본 보존)

> #109: https://zipath-web.vercel.app/real-price 또는 /real-price/compare 로 직접 이동할 때마다 콘솔에 React #418(하이드레이션 실패), #423(전체 root 클라이언트 렌더 전환), #425(텍스트 콘텐츠 불일치)가 매번 7~8건 발생. console errors: `#425 × 5`, `#418 × 1`, `#423 × 1`. 양쪽 페이지에서 재현. 기대: 콘솔 오류 없이 SSR·CSR 렌더 결과 일치.

### 결정 사항 (Q&A)

- Q: #91/#97, #103/#112에서 이미 "동일한 8건(#425×N, #418, #423)"을 두 번 수정했는데 왜 또 재보고되나? 코드가 아직 안 고쳐졌나?
  - A(조사 결과): 코드는 이미 충분히 방어되어 있다. **진짜 원인은 배포 누락이다.**
    - `develop` 브랜치: `apps/web/src/app/layout.tsx`의 `<html lang="ko" suppressHydrationWarning>` / `<body ... suppressHydrationWarning>` 적용됨 (#103 fix, PR #112로 develop 머지 완료).
    - `main` 브랜치(= Vercel 프로덕션 배포 소스): `<html lang="ko">` / `<body className="...">` — **suppressHydrationWarning 없음**. 즉 #103 수정이 `develop`에만 있고 `main`으로 릴리즈되지 않았다.
    - Vercel은 `main` push 시 배포(CLAUDE.md "Deploy Web: push to main"). 따라서 프로덕션은 여전히 미수정 빌드를 서빙 중 → 오류가 그대로 재현된다.
- Q: 페이지 코드(`/real-price`, `/real-price/compare`)에 실제 SSR/CSR mismatch가 남아 있나?
  - A: 없다. 두 페이지 모두 초기 state가 결정적이다: `monthOptions=[]`, `dealYmd=""`, `selectedRegions=[]`, `searched=false`. `new Date()` 의존 계산은 전부 `useEffect`에서 수행 → SSR HTML과 CSR 첫 렌더가 동일(계약월 `<select>`는 양쪽 모두 `<option value="">불러오는 중...</option>`). useEffect 이후 state 변경은 정상적인 post-hydration 리렌더이며 hydration 오류가 아니다. Recharts는 `dynamic(..., { ssr:false })`로 SSR 제외, 로딩 fallback이 서버/클라 첫 렌더 동일. `AuthContext`는 `user=null`/`isLoading=true` 결정적 초기값, localStorage 접근은 `typeof window` 가드 + useEffect 내부. `next/font`·`useId`·렌더 중 `Math.random()` 미사용.
  - 결론: 8건은 **프로덕션 minified 빌드 전용**으로, 외부 주입(브라우저 확장의 `<body>` 속성/클래스 주입: 다크모드·번역·Grammarly 등)이 minify된 React에서 #418로 표면화 → Suspense 외부 하이드레이션 실패(#423) → 루트 클라이언트 재렌더(#425×N) 연쇄. `suppressHydrationWarning`이 정확한 차단책이며, 이미 `develop`에 있다.
- Q: 그럼 #109에서 새로 할 일은 무엇인가?
  - A: (1) `develop`의 layout 수정이 이 워크트리/브랜치에도 반영되어 있는지 확인(이미 반영됨), (2) `develop` → `main` 릴리즈로 프로덕션에 배포되도록 하는 것이 본질. 단 이 워크플로우(`/prep`→`/code`→PR→develop)는 develop 타겟이므로, 코드 레벨에서 추가로 할 수 있는 **방어 강화**(자식 노드 mismatch까지 가리지 않는 `suppressHydrationWarning`의 한계 보완)를 함께 적용하고, 릴리즈 필요성을 PR/이슈에 명시한다.
- Q: `suppressHydrationWarning`은 자식 노드 mismatch를 못 가린다. #425(텍스트 불일치 ×5)가 자식에서 나는 거면?
  - A: dev 빌드(non-minified)에서 정확한 mismatch 노드를 재확인한다(Phase 1). 두 차례 정적 진단에서 자식 mismatch가 없었으므로 외부 주입 가설이 유력하나, dev 재현으로 확정한다. 만약 자식 노드 mismatch가 실제로 잡히면 그 노드만 좁게 수정한다(Phase 3 조건부).
- Q: 커밋 자동 생성?
  - A: `/code` 단계 규칙. 1 Phase = 1 커밋.

### 구현 단계 (Phase)

1. [ ] Phase 1: dev 재현 + 정확한 mismatch element 진단 (산출물 = 이 플랜 갱신)
   - `npm run dev -w @zipath/web` 실행 후 Playwright로 `/real-price`·`/real-price/compare` 직접 접속, 콘솔 React 경고 캡처. dev 빌드는 non-minified라 #418/#425가 발생한다면 "어떤 DOM 노드/텍스트"인지 전체 메시지가 나온다. dev에서 0건이면 "프로덕션 전용(외부 주입) + 배포 누락" 가설 확정.
   - 결과를 이 플랜의 "진단 결과 (Phase 1)" 절에 기록.
   - 파일: `plans/109-react-hydration-error.md`
   - 커밋: `docs: #109 하이드레이션 오류 dev 재현/진단 결과 기록`

2. [ ] Phase 2: 루트 레이아웃 하이드레이션 방어 재확인 + (조건부) 보강
   - `apps/web/src/app/layout.tsx`에 `<html>`/`<body>` `suppressHydrationWarning`이 이미 있는지 확인(현재 워크트리 기준 적용됨). 누락 시 추가.
   - Phase 1에서 dev 재현이 0건이고 외부 주입 가설이면, 본 Phase는 "이미 적용됨 — 변경 없음"으로 기록하고 코드 변경 없이 통과. (실질 수정이 없으면 빈 커밋 대신 Phase 3/4로 진행)
   - 파일: `apps/web/src/app/layout.tsx`
   - 커밋(조건부): `fix(web): #109 루트 레이아웃 suppressHydrationWarning 보강`

3. [ ] Phase 3: (조건부) Phase 1에서 실제 자식 노드 mismatch가 잡힌 경우만 좁게 수정
   - 후보: `/real-price`·`/real-price/compare`의 `<select value=...>`/`<option>`, 텍스트 노드, `AuthContext` 소비 노드. 정확히 재현된 element에만 `suppressHydrationWarning` 부여 또는 SSR/CSR 첫 렌더 동일화. dev 재현 0건이면 "원인 없음 — 스킵"으로 기록.
   - 파일(조건부): `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/real-price/compare/page.tsx`, 관련 `_components/*`
   - 커밋(조건부): `fix(web): #109 잔여 하이드레이션 노드 수정`

4. [ ] Phase 4: 검증 + 회귀 + 릴리즈 경로 명시
   - `npx turbo lint --filter=@zipath/web`(ESLint 0), `npx turbo build --filter=@zipath/web`(`/real-price`·`/real-price/compare` prerender 정상) 통과.
   - dev 서버에서 양 페이지 콘솔 React #418/#423/#425 0건 재확인.
   - **핵심: 이 수정의 프로덕션 반영은 `develop` → `main` 릴리즈 필요**임을 PR 본문/이슈에 명시(Vercel은 `main`에서만 배포, `main`에는 #103 fix가 아직 없음). 본 PR이 develop에 머지된 뒤에도 `main` 릴리즈 전까지 프로덕션 콘솔 오류는 지속됨을 고지.
   - 파일: 없음(검증/문서).
   - 커밋: 필요 시 검증 보강만.

### 영향 범위

- 프론트엔드 전용: `apps/web`. 백엔드(`@zipath/api`) 변경 없음.
- 핵심은 코드가 아니라 **릴리즈(develop→main)**. 코드 측 변경은 layout 방어 재확인(이미 적용) + 조건부 잔여 노드 수정뿐이라 부작용 매우 낮음.
- `suppressHydrationWarning`은 해당 노드 속성 차이만 무시 — 콘텐츠 mismatch는 그대로 감지됨.
- TypeScript strict 유지, `any` 금지. 법적 고지 문구 변경 없음.

### 테스트 계획

- Phase 1: `npm run dev -w @zipath/web` + Playwright로 `/real-price`·`/real-price/compare` 콘솔 캡처(non-minified 전체 메시지 확보).
- Phase 2/3: `npx turbo build --filter=@zipath/web`, `npx turbo lint --filter=@zipath/web`.
- Phase 4: dev 서버에서 양 페이지 React #418/#423/#425 0건 재확인.
- API 변경 없음 → `npm test -w @zipath/api`는 영향 없음(요구 시 실행).

### 진단 결과 (Phase 1)

(Phase 1 실행 시 기록)

핵심 사전 조사 결론(코드 정적 분석):
- `develop`의 `apps/web/src/app/layout.tsx`는 `suppressHydrationWarning` 적용됨. `main`(프로덕션 배포 소스)에는 **미적용** → 프로덕션이 미수정 빌드를 서빙해 오류 재현.
- `/real-price`, `/real-price/compare` 페이지 트리에 SSR/CSR 첫 렌더가 갈리는 잔여 mismatch 노드 없음(초기 state 결정적, 날짜 계산은 useEffect, Recharts ssr:false, AuthContext 결정적 초기값).
- 8건은 프로덕션 minified 빌드 전용 외부 주입(브라우저 확장) 패턴으로 분류. 근본 차단책 = 루트 `suppressHydrationWarning`(이미 develop에 존재) + `main` 릴리즈.
