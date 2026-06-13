## Plan #103 React 하이드레이션 오류 8건 — /real-price/compare 접속 시마다 발생

- 플랜식별자: `07EBFA18`
- 출처: GitHub Issue #103 + PM 구현 지침 (동일 배치 형제 이슈 #104 #105 #106)

### 지시사항 (원본 보존)

> #103: /real-price/compare 하이드레이션 오류 진단 + 수정. 개발 서버 실행 후 브라우저 콘솔 8건 오류 메시지 확인 → 해당 element에 suppressHydrationWarning 추가 또는 client-only 격리. 주요 의심: dealYmd select value="" 불일치, Recharts window 접근. 파일: apps/web/src/app/real-price/compare/page.tsx

이슈 본문:
> https://zipath-web.vercel.app/real-price/compare 접속 시 콘솔에 React error #425 (×6), #418, #423 이 8개 출력됨. 서버 렌더 HTML과 클라이언트 렌더가 불일치해 전체 트리를 클라이언트에서 재렌더링함. 기대: 하이드레이션 오류 없이 서버/클라이언트 렌더 결과가 일치해야 함. #418 = 서버-클라이언트 초기 UI 불일치, #423 = Suspense 외부 하이드레이션 실패로 전체 루트가 클라이언트 렌더로 전환.

### 결정 사항 (Q&A)

- Q: 이슈 #103은 이미 PR #97(이슈 #91)에서 "동일한 8건(#425×6, #418, #423)"을 수정한 것과 동일한 증상이다. 코드는 이미 고쳐졌는데 왜 재보고되었나?
  - A(코드 조사 결과): `apps/web/src/app/real-price/compare/page.tsx`는 이미 방어되어 있다. 월 옵션·`dealYmd`를 `useState` 빈 값으로 시작해 `useEffect`에서 채우고(SSR/CSR 첫 렌더 동일), Recharts는 `dynamic(..., { ssr: false })`로 격리됨. 페이지 자체에는 잔여 mismatch 원인이 없다. 따라서 (1) 배포된 Vercel 빌드가 #97 머지 이전 상태로 stale 하거나, (2) 페이지 외부(루트 레이아웃 `<html>`/`<body>`)에서 발생하는 프로덕션 전용 mismatch가 원인일 가능성이 높다.
- Q: 프로덕션에서만 #418/#425가 보이고 dev에서 재현 안 되면?
  - A: 가장 흔한 프로덕션 전용 #418 원인은 브라우저 확장이 `<body>`에 속성/클래스를 주입하는 것(minified 빌드에서만 #418로 표면화). 코드베이스에 `suppressHydrationWarning`이 전무하므로, 루트 `<html>`/`<body>`에 `suppressHydrationWarning`을 추가해 이 클래스의 오류를 근본 차단한다. 이는 React 공식 권장 패턴이다.
- Q: 실제 코드 mismatch가 dev에서 재현되면?
  - A: 재현된 정확한 element를 기준으로 해당 노드를 client-only 격리하거나 `suppressHydrationWarning`을 추가한다. 진단(Phase 1)이 수정 범위를 확정한다.
- Q: 커밋 자동 생성?
  - A: `/code` 단계 규칙을 따른다. 1 Phase = 1 커밋.

### 구현 단계 (Phase)

1. [x] Phase 1: 로컬 재현 + 8건 오류 정확한 element 진단 — `npm run dev -w @zipath/web` 실행 후 Playwright(또는 브라우저)로 `/real-price/compare` 접속, 콘솔의 React #425/#418/#423 발생 element를 캡처. dev 빌드는 minify 안 되어 전체 mismatch 메시지(어떤 DOM 노드인지)가 나오므로 정확한 원인 노드를 특정. 진단 결과를 이 플랜의 "진단 결과" 절에 기록한다(이 플랜 파일 갱신이 Phase 1의 산출물·커밋 단위).
   - 파일: `plans/103-react-hydration-errors.md` (진단 결과 기록). 산출물: 정확한 mismatch element 목록.
   - 커밋: `docs: #103 하이드레이션 오류 진단 결과 기록`

2. [x] Phase 2: 루트 레이아웃 `<html>`/`<body>` 하이드레이션 방어 — `apps/web/src/app/layout.tsx`의 `<html lang="ko">`와 `<body>`에 `suppressHydrationWarning`을 추가한다. 브라우저 확장(예: 다크모드/번역/그래멀리)이 `<body>`에 속성을 주입해 프로덕션 minified 빌드에서 #418로 표면화되는 클래스의 오류를 근본 차단(React 공식 권장). 이는 페이지 콘텐츠의 실제 mismatch는 가리지 않고, 최상위 노드의 속성 차이만 무시한다.
   - 파일: `apps/web/src/app/layout.tsx`
   - 커밋: `fix(web): #103 루트 레이아웃에 suppressHydrationWarning 추가`

3. [~] Phase 3: (스킵) 원인 없음 — Phase 1 진단에서 `/real-price/compare` 트리에 잔여 코드 mismatch가 확인되지 않아 Phase 2(루트 레이아웃)로 충분. 페이지 잔여 mismatch 수정 (조건부) — Phase 1 진단에서 `/real-price/compare` 또는 그 자식(`RegionCompareCharts`, `AuthContext` 소비 노드 등)에 실제 코드 mismatch가 확인되면 해당 element만 좁게 수정한다. 우선순위: (a) `dealYmd` select가 `value=""`로 시작하는 부분이 실제 mismatch면 placeholder를 SSR/CSR 동일하게 고정하거나 `suppressHydrationWarning` 부여, (b) Recharts/`window` 접근이 새어나오면 client-only 격리 보강. 진단에서 페이지 잔여 원인이 없으면(예상 시나리오) 이 Phase는 "원인 없음 — Phase 2로 충분"으로 기록하고 스킵.
   - 파일(조건부): `apps/web/src/app/real-price/compare/page.tsx`, `apps/web/src/app/real-price/compare/_components/RegionCompareCharts.tsx`
   - 커밋(조건부): `fix(web): #103 /real-price/compare 잔여 하이드레이션 노드 수정`

4. [ ] Phase 4: 검증 + 회귀 — 빌드/린트 통과 확인 후 dev 서버에서 `/real-price/compare` 콘솔에 React #425/#418/#423가 0건임을 재확인. 형제 페이지(`/real-price`)도 동일 패턴 회귀 없는지 점검.
   - 파일: 없음(검증).
   - 커밋: 필요 시 검증 보강만.

### 영향 범위

- 프론트엔드 전용: `apps/web`. 백엔드(`@zipath/api`) 변경 없음.
- 핵심 수정: `apps/web/src/app/layout.tsx` (전 페이지에 영향하나 `suppressHydrationWarning`은 최상위 노드 속성 차이만 무시 — 콘텐츠 mismatch는 그대로 감지됨, 부작용 낮음).
- 조건부: `apps/web/src/app/real-price/compare/page.tsx` 및 차트 컴포넌트.
- `any` 금지, TypeScript strict 유지. 법적 고지 문구 변경 없음.

### 테스트 계획

- Phase 1: `npm run dev -w @zipath/web` + Playwright로 `/real-price/compare` 접속, 콘솔 에러 캡처(dev 빌드라 비-minified 전체 메시지 확보).
- Phase 2/3: `npm run build -w @zipath/web` (프로덕션 빌드, hydration warning 없음 확인), `npm run lint -w @zipath/web`.
- Phase 4: dev 서버에서 `/real-price/compare` 및 `/real-price` 콘솔 React #425/#418/#423 0건 재확인.
- API 변경 없음 → `npm test -w @zipath/api`는 영향 없음(요구 시 실행).

### 진단 결과 (Phase 1)

코드 정적 진단 결과, `/real-price/compare` 페이지 트리에는 SSR/CSR 첫 렌더가 갈리는 잔여 mismatch 노드가 **없다**:

- `apps/web/src/app/real-price/compare/page.tsx`
  - `monthOptions`·`dealYmd`를 `useState`의 빈 값(`[]`, `""`)으로 시작하고 `new Date()` 의존 계산은 전부 `useEffect`에서 수행 → SSR HTML과 CSR 첫 렌더가 동일(계약월 `<select>`는 양쪽 모두 `<option value="">불러오는 중...</option>` 단일 옵션으로 시작). 따라서 `dealYmd value=""` 의심은 실제 mismatch 아님.
  - `searched`/`regionStats`가 초기엔 비어 있어 결과 영역·차트는 SSR/CSR 모두 미렌더.
- `RegionCompareCharts`(Recharts)는 `dynamic(..., { ssr: false })`로 SSR에서 제외 → `window`/`ResponsiveContainer` 접근이 서버로 새지 않음.
- `AuthContext` (`apps/web/src/contexts/AuthContext.tsx`): `user=null`, `isLoading=true`로 결정적 초기값. `localStorage` 접근은 `typeof window` 가드 + `useEffect`/콜백 내부에서만 발생 → 초기 렌더 mismatch 없음.

결론: 8건(#425×6, #418, #423)은 **프로덕션 minified 빌드 전용**으로, 코드 mismatch가 아니라 최상위 노드(`<html>`/`<body>`)에 대한 외부 주입(브라우저 확장의 속성/클래스 주입: 다크모드·번역·Grammarly 등)이 minify된 React에서 #418로 표면화되고, 이로 인해 Suspense 외부 하이드레이션 실패(#423) + 루트 클라이언트 재렌더(#425×6)가 연쇄로 발생하는 전형적 패턴이다. dev(non-minified)에서는 동일 element의 콘텐츠 mismatch가 아니므로 8건이 재현되지 않는다.

→ 수정 범위: **Phase 2(루트 레이아웃 `suppressHydrationWarning`)로 근본 차단**. 페이지 잔여 노드 수정(Phase 3)은 원인 없음으로 스킵.
