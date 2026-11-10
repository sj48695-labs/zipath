# #128 운영 실거래가 hydration 잔여 검증

- 플랜식별자: `0D5059C6` (기존 계획 유지)
- 출처: [#128 본문·댓글](https://github.com/sj48695-labs/zipath/issues/128), [11/13 회의 지침](https://github.com/sj48695-labs/zipath/issues/128#issuecomment-6845471837), 사용자 PM 지침.
- 판정: #157 CLOSED, PR #147·#150 MERGED. 잔여 작업은 운영 직접 접근·새로고침의 React 오류 0건, 계약월 초기값, 실제 배포 SHA 확인이다. 최신 감사에는 React 오류가 없으며, 과거 오류 7건을 이번 결과로 보고하지 않는다.
- 재사용: PR #154 / `128-react-hydration-7` / 현재 worktree. 기존 구현·커밋을 보존한다.
- 상태: **plan 재검토 완료, Phase 1·2 미완료**. 이번 호출은 조사·plan 및 옆 기록 파일 커밋까지만 허용한다.
- 실행 기록: [128-real-price-react-hydration-errors.log.md](./128-real-price-react-hydration-errors.log.md). 기본 입력에서 제외하고 특정 증적이 필요할 때만 해당 절을 읽는다.

## 사용자와 기대 동작

부동산 입문자가 실거래가 화면에 바로 들어와 현재 계약월을 확인하고 지역을 골라 조회할 수 있어야 한다.
`ui-design` match mode로 기존 `apps/web/src/app/globals.css` 토큰과 `apps/web/src/components/layout/SiteHeader.tsx`의 헤더·법적 고지를 따른다.

## 현재 구조와 보존할 완료 작업

- PR #147 (`0538ac971c5e716c6b7fe6c1dd72bcfbf780e305`)의 hydration 수정과 PR #150 (`5b9178f15167d61fa32adbf91e7b15493126b464`)의 계약 테스트는 병합 완료다. 역사적 `[P1]` 계약 테스트 커밋 `62d3c02`도 유지하며 다시 구현하지 않는다.
- `apps/web/src/app/real-price/page.tsx`의 `RealPricePage`, `apps/web/src/app/real-price/compare/page.tsx`의 `RegionComparePage`: `dealYmd=""`, `monthOptions=[]`로 시작하고 마운트 `useEffect`에서만 현재 월을 채운다. 서버 select는 disabled·빈 값·`불러오는 중...`이다.
- 공유 함수 `apps/web/src/app/real-price/_lib/monthOptions.ts`의 `buildRecentMonthOptions`는 현재 월부터 12개월 내림차순을 만든다. 같은 디렉터리 `monthOptions.test.ts`가 월 순서·연도 경계를 검사한다. 호출자는 위 두 화면이다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts`의 `routes`, `collectHydrationIssues`, `expectPendingMonthSelect`, `contractMonthSelect`: 두 경로 직접 접근의 서버 초기 상태·YYYYMM·hydration 오류/경고를 검사한다. 새로고침·390px·현재 월 일치 여부는 수동 보완한다.
- `apps/web-e2e/tests/real-price-status.spec.ts`의 `openSearch` 및 세 상태 테스트는 loading→empty, error→재시도→empty 선례다. API mock 결과는 upstream 성공 증거와 구분한다.
- `apps/web-e2e/playwright.config.ts`: 운영 URL 기본값, desktop chromium 프로젝트. 기존 테스트·설정·의존성을 그대로 재사용한다.

## 범위와 제약

- 제품 코드·테스트·설정·export·fixture 변경 없음. 새 추상화·의존성·테스트 파일·배포 파이프라인을 만들지 않는다. 공통 추출 P0 불필요.
- 후속 결과는 모두 옆 `.log.md`에 남긴다. `docs/verification/` 별도 문서를 새로 만들지 않는다. 기록으로 생긴 새 필수 조건은 plan에도 반영한다.
- #158의 실거래가 timeout 전체 검증 및 #122의 청약 검증은 형제 작업이다. #128에서는 hydration 검증에 필요한 기본 상태 흐름만 확인한다. favicon 404는 #85와 중복 확인할 별도 후보이며 hydration 건수에서 분리한다.
- 과거 로컬 자료에 실패 증거가 있다. 날짜·URL·배포를 구분하고 현재 합격/실패로 재사용하지 않는다. 새 검증 실패 시 원인 증거를 보존하고 기존 수정을 반복하지 않는다.
- 배포 SHA는 로컬/PR HEAD·build ID·오래된 GitHub deployment·PR preview 성공으로 추정하지 않는다. alias와 deployment 연결을 확인해야 한다.
- 기존 배포 workflow는 SHA 불일치 시 배포를 생성하고 이전 실행도 실패했다. 재실행, secret 생성, 배포·승격·복구를 수행하지 않는다. 읽기 전용 정보가 없으면 SHA 미확인으로 남긴다.
- PR Draft 유지. 이슈 종료·댓글 게시·Ready·merge·auto-merge·push·rebase·worktree 전환/삭제·브랜치 정리 금지. 후속 파이프라인에 상태만 전달한다.

## 변경 파일

- 이번 /plan: 이 파일과 `plans/128-real-price-react-hydration-errors.log.md`만 커밋.
- 후속 Phase 1: 옆 `.log.md` 1개.
- 후속 Phase 2: 옆 `.log.md`, 이 plan의 완료 마커, 필요 시 `output/playwright/128/` 스크린샷 최대 2개. 상세 콘솔/HTML/행렬은 로그에 기록하여 파일 5개 이내로 유지한다.
- 기존 staged 검증 자료는 그대로 보존하고 선택한 phase 커밋에 섞지 않는다.

## Phase별 실행 계획

### Phase 1: 운영 alias의 배포 신원 확인 (미완료)

- 관심사: 배포 SHA 근거. 변경 파일 1개: `plans/128-real-price-react-hydration-errors.log.md`.
- 선례: `.github/workflows/production-web-regression.yml`의 `verify-production-deployment`에 있는 `meta.githubCommitSha`·READY·target 필드만 참고한다. workflow 자체는 실행하지 않는다.
- 시작 시 PR #154 Draft·head SHA, 로컬 HEAD, #157 상태를 읽기 전용으로 재확인한다.
- 사용 가능한 인증된 Vercel 도구/CLI/API에서 `https://zipath-web.vercel.app` alias가 가리키는 deployment ID·URL·production target·READY 상태·`meta.githubCommitSha`를 확인한다. 대안은 alias 연결이 명확한 배포 상세/성공 workflow summary다. 인증값은 출력·기록하지 않는다.
- 배포 SHA가 #147·#150 수정 포함 소스를 가리키는지도 확인한다. 문서만 달라진 PR HEAD와 운영 SHA가 문자 그대로 같을 필요는 없다.
- UTC/KST 시각·자료 출처·실제 alias 연결·SHA·확인 가능/불가 항목을 로그에 남긴다. 인증/도구가 없으면 정확한 제약을 남기고 전체 완료는 보류한다. Phase 2의 UI 검증은 독립적으로 진행할 수 있다.
- 검증: alias→deployment→SHA 연결과 수정 포함 여부를 추적할 수 있어야 합격. 단순 latest deployment 조회만으로 합격 처리하지 않는다.
- 커밋: `docs(web): #128 [P1] 운영 배포 SHA 확인 결과 기록`. 시도 기록 커밋과 phase 합격을 구분한다.

### Phase 2: 운영 hydration·계약월 검증 (미완료)

- 관심사: 실제 브라우저 동작. Phase 1 결과와 합쳐 완료 판정하되 SHA 조회 실패가 UI 확인을 막지는 않는다.
- 파일: 옆 `.log.md` + 이 plan 완료 마커 + 필요 시 대표 desktop/390px 스크린샷 2개. 제품 코드·영구 테스트 추가 없음.
- 선례·심볼: `real-price-hydration.spec.ts`의 `collectHydrationIssues`, `expectPendingMonthSelect`, `contractMonthSelect`; `real-price-status.spec.ts`의 `openSearch`와 상태 테스트. 해당 브라우저/Playwright 스킬을 먼저 읽는다.
- 기존 계약 실행: `ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- real-price-hydration.spec.ts --project=chromium --workers=1`. 설치된 의존성/브라우저를 우선한다. 도구 실행 실패는 제품 회귀와 구분한다.
- 이후 아래 8회 검증을 수행한다. 경로/viewport마다 새 context에서 직접 접근한 뒤 같은 URL을 새로고침한다. 각 navigation 전에 console warning/error·pageerror 수집을 시작하고 시도별로 초기화한다. 페이지 DOM이 정상이어도 pageerror 누락을 합격으로 간주하지 않는다.

| 경로 | viewport | 진입 |
| --- | --- | --- |
| `/real-price` | 1440×900 | 직접 접근, 새로고침 |
| `/real-price` | 390×844 | 직접 접근, 새로고침 |
| `/real-price/compare` | 1440×900 | 직접 접근, 새로고침 |
| `/real-price/compare` | 390×844 | 직접 접근, 새로고침 |

- 매 시도 HTTP 상태, 응답 HTML의 disabled·빈 값·pending 옵션, 마운트 후 선택값/라벨·12개월 옵션·활성화 상태를 기록한다. 브라우저 timezone·현재 시각 기준으로 선택값이 현재 연월이고 목록이 내림차순인지 확인한다. 월 경계는 시도를 분리한다.
- React #425/#418/#423, 일반 hydration 오류·경고 및 관련 pageerror가 각각 0건인지 확인한다. favicon 및 다른 오류는 별도 항목으로 숨기지 않고 기록한다.
- desktop/390px에서 헤더·법적 고지·계약월·조회/비교 버튼의 잘림, 가로 넘침, 기본 키보드 조작을 확인한다. 대표 스크린샷은 실패 상태를 우선 보존한다.
- 동일 viewport에서 기존 route mock 선례로 조회→loading→empty, error→재시도→empty를 확인한다. 실제 운영 탐색과 mock 상태 결과를 명확히 구분한다. timeout·외부 API 전체 회귀는 #158에서 다룬다.
- 로그에 시각·URL·viewport·행동·기대/실제·콘솔 원문·명령/종료 코드·스크린샷 경로를 남긴다. P0 Broken / P1 Blocking / P2 Improving / Skip으로 발견을 분류한다.
- 새 실패는 배포 불일치·제품 회귀·도구/인증 제약으로 구분한다. 배포가 오래됐거나 SHA가 미확인이면 같은 hydration 코드 수정으로 우회하지 않는다. 최신 수정 포함 배포에서도 회귀를 확인한 경우에만 증적을 근거로 plan에 작은 신규 수정 phase를 추가한다.
- 커밋: `docs(web): #128 [P2] 운영 hydration 검증 결과 기록`. 통과한 phase만 완료 표시하고 plan과 로그를 `git add -f`로 함께 보존한다.

## 완료 조건

- [ ] Phase 1: 운영 alias→deployment→SHA·출처·검증 시각을 확보하고 기존 수정 포함 여부를 확인했다.
- [ ] Phase 2: 8회 모두 서버 pending 계약과 현재 계약월·12개월 옵션이 맞고 hydration 오류/경고·관련 pageerror 0건이다.
- [ ] desktop/390px 기본 흐름 및 loading/empty/error→재시도 결과가 남아 있고 mock/실운영을 구분했다.
- [ ] 미확인/실패 항목을 숨기지 않고 plan의 미완료 조건과 옆 기록에 반영했다. 기록·스크린샷의 날짜를 최신 감사와 혼용하지 않았다.
- [ ] 성공해도 Draft 유지 및 후속 파이프라인 전달까지만 수행한다. Ready·merge·auto-merge·cleanup은 실행하지 않는다.

## 계획 검증

문서 변경만 검증한다: `git diff --check` 및 두 파일의 기록 분리·phase/완료 마커·파일 수·실행 경계 대조. 이번 /plan에서 빌드·단위 테스트·운영 브라우저 검증을 실행하지 않는다.
