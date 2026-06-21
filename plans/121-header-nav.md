# #121 헤더 내비게이션 — 모바일 햄버거 메뉴

- 플랜식별자: `4639A44D`
- 출처: `#121`

## 현재 구조 분석

- 공통 헤더는 `apps/web/src/components/layout/SiteHeader.tsx` 하나로, 모든 메인
  페이지(`/subscription`, `/loan`, `/checklist`, `/real-price`, `/announcements`
  등)가 직접 `<SiteHeader />`를 렌더링한다.
- `NAV_LINKS`(청약/대출/체크리스트/실거래가) 4개 링크 + `NotificationBell`이
  `<nav className="flex items-center gap-6 ...">`에 항상 표시된다 (인증 무관).
- **이슈가 보고한 "nav 링크 누락" 버그는 이미 해결됨**: 커밋
  `edc351b fix(web): #108 [P2] 청약/대출/체크리스트 페이지 헤더 nav 복구`가
  세 페이지에 SiteHeader를 복구했고, 이는 develop(이 브랜치의 base)에 머지되어
  있다. 프로덕션 스냅샷은 #108 배포 이전 상태를 캡처한 것.
- 회귀 방지 e2e가 이미 존재: `apps/web-e2e/tests/header-nav.spec.ts` (데스크톱
  뷰포트에서 세 경로의 nav 링크 4개 노출 검증).
- **실제 남은 작업**: nav가 반응형이 아님 — `flex` 고정 한 줄이라 좁은 화면에서
  링크가 넘치거나 좁게 눌린다. PM 지침의 **모바일 햄버거 메뉴는 미구현**.
- 의존성: `lucide-react@^0.344.0` 사용 가능(아이콘). UI 패키지(`@zipath/ui`)에는
  Sheet/Dropdown 프리미티브 없음 → 경량 자체 토글로 구현.

## 변경 파일

- `apps/web/src/components/layout/SiteHeader.tsx` (반응형 + 햄버거)
- `apps/web/web-e2e/tests/header-nav.spec.ts` → 실제 경로
  `apps/web-e2e/tests/header-nav.spec.ts` (모바일 케이스 추가)

## Phase별 구현 계획

### Phase 1 (완료): SiteHeader 반응형 + 모바일 햄버거 메뉴 (커밋 단위)

- 변경 파일: `apps/web/src/components/layout/SiteHeader.tsx`
- 구현:
  - `"use client"` 유지. `useState`로 모바일 메뉴 open/close 상태 관리.
  - 데스크톱: 기존 링크 묶음을 `hidden md:flex`로 감싸 md 이상에서만 노출
    (기존 스타일 `gap-6 text-sm text-muted-foreground hover:text-foreground` 유지).
    `NotificationBell`은 데스크톱/모바일 공통으로 항상 표시.
  - 모바일(`md:hidden`): 햄버거 버튼(lucide `Menu`/`X` 토글, `aria-label`,
    `aria-expanded`) 추가. 열렸을 때만 링크 목록을 조건부 렌더링하는 드롭다운
    패널(헤더 아래 `border-b` 컨테이너)을 노출.
  - **DOM 중복 방지**: 모바일 메뉴는 열렸을 때만 링크를 렌더링한다. 닫힌
    데스크톱 뷰포트에서는 링크가 데스크톱 묶음에만 존재 → 기존 e2e의
    `getByRole('link', {name})` strict 매칭이 깨지지 않는다.
  - 링크 클릭 시 메뉴 닫힘(`onClick`으로 open=false).
  - 단일 `<nav>` 랜드마크 유지(데스크톱 링크 + 모바일 패널 모두 같은 nav 내부)
    하여 `getByRole('navigation')` 모호성 방지. (모바일 패널을 nav 밖에 둘 경우
    landmark 2개가 되어 기존 테스트가 깨질 수 있으므로 nav 내부에 둔다.)
- 테스트:
  - `npx turbo lint` / `npx turbo build` 통과(타입 체크 포함).
  - 데스크톱 뷰포트 수동 확인: 링크 4개 한 줄 노출, 햄버거 미노출.
  - 모바일 폭(<768px) 수동 확인: 링크 숨김 + 햄버거 노출 → 클릭 시 링크 패널.

### Phase 2 (완료): 모바일 햄버거 e2e 테스트 (커밋 단위)

- 의존성: Phase 1
- 변경 파일: `apps/web-e2e/tests/header-nav.spec.ts`
- 구현:
  - 기존 데스크톱 회귀 테스트는 유지(변경 없음).
  - 모바일 뷰포트(예: `page.setViewportSize({ width: 375, height: 812 })`)
    케이스 추가: `/subscription`에서
    1. 햄버거 버튼(`aria-label`/role=button)이 보인다.
    2. 클릭 전에는 메뉴 링크가 보이지 않는다.
    3. 클릭 후 nav 링크 4개(청약/대출/체크리스트/실거래가)가 보인다.
- 테스트:
  - `npm test -w @zipath/web-e2e` (dev/배포 URL 대상, optional 환경) 또는 로컬
    dev 서버 대상 실행으로 통과 확인.

## 테스트 계획

1. `npx turbo lint` — 타입/린트 통과.
2. `npx turbo build` — web 빌드 통과.
3. web-e2e: 데스크톱 회귀(기존) + 모바일 햄버거(신규) 통과.
4. 수동: 데스크톱/모바일 뷰포트에서 nav 노출·토글·링크 이동 동작 확인.
