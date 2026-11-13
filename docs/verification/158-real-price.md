# #158 실거래가 검증 기록

실행일: 2026-11-11 KST. **운영 수용 미완료.** 검증 코드를 추가했지만 운영 상태 UI 통과 또는 API 성공을 확인했다고 보고하지 않는다.

## 대상과 소스

- 운영 URL: https://zipath-web.vercel.app/real-price
- viewport: desktop 1280×900 / mobile 390×844
- 기준 소스: `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`, plan `84bc07d`, 검증 소스 P1 `4a2910b`, P2 `dd3c571`, P3는 이 문서와 같은 커밋.
- 운영 SHA: **확인 불가**. 읽기 전용 GitHub Production deployment 조회의 최신 메타데이터는 `e42afda31ec08f5969f9796315232ec92f1b9cd9` (2026-05-05, deployment ID 4588149208)다. 현재 Vercel alias SHA와 동일하다고 단정하지 않는다.
- 운영 경로 HEAD는 HTTP 200, `x-vercel-cache: HIT`. 경로 응답은 실제 조회 성공 증거가 아니다.

## 실행과 관찰

모든 브라우저 명령은 `PLAYWRIGHT_BROWSERS_PATH=/Users/sujeong/Library/Caches/ms-playwright`와 명시적 `ZIPATH_BASE_URL`을 사용했다. 기본 환경은 존재하지 않는 `/nonexistent/devloop-codex-sandbox-no-browser`를 가리켰다. 설치 캐시로 바꾼 뒤 sandbox MachPort 권한 오류를 확인하여 승인된 sandbox 밖 Chromium에서 실행했다. 환경 실패를 제품 실패나 TDD RED로 계산하지 않는다.

| 명령 | 결과 / 종료 코드 |
| --- | --- |
| `npm test -w @zipath/web-e2e -- real-price-status.spec.ts --workers=1 --output=../../output/playwright/158-p1` (운영 URL) | 6 failed, exit 1. 두 viewport 모두 조회 전 법적 고지 assertion 실패. 상태·재시도 검사는 도달하지 못했다. |
| `npm test -w @zipath/web-e2e -- real-price-timeout.spec.ts --workers=1 --output=../../output/playwright/158-p2` (운영 URL, 최초 버전) | 최초 2건 clock.pauseAt 기준시각 오류. 테스트 수정 후 이 실행을 중단했다. timeout 계약의 실패 증거로 사용하지 않는다. |
| `npm test -w @zipath/web-e2e -- real-price-status.spec.ts real-price-timeout.spec.ts --workers=1 --output=../../output/playwright/158-local-final` (`http://localhost:3101`) | 실행했으나 초기 컴파일 중 page.goto 30초 초과 발생. 현재 구현의 GREEN 증거는 미확보. |
| `npm test -w @zipath/web-e2e -- real-price-production.spec.ts production-smoke.spec.ts --workers=1 --output=../../output/playwright/158-production` (운영 URL) | 기존 smoke 홈 렌더링·실거래가 접근 통과, 법적 고지·청약 입력·favicon 실패. 실제 조회 결과는 아래 최종 기록 참조. |
| `npm test -w @zipath/api` | 실행 예산 내 결과 미확보로 SIGINT 중단, exit 130. 통과 아님. |
| `npm test -w @zipath/web -- --runInBand` | exit 0, 11 suites / 51 tests passed. |
| `npx turbo lint` | exit 0, 5 tasks successful (cache). |
| `npx turbo build` | exit 0, 3 tasks successful (cache). 새 E2E는 이 build의 대상이 아니다. |
| `npx tsc --noEmit -p apps/web-e2e/tsconfig.json` | exit 0, 타입 오류 없음. |
| `npm run typecheck --workspaces --if-present` | exit 0, DB typecheck 통과. |
| `git diff --check` | exit 0. |

실행 로그: `/tmp/158-p1-unsandboxed.log`, `/tmp/158-p2.log`, `/tmp/158-local-final.log`, `/tmp/158-production.log`, `/tmp/158-api.log`, `/tmp/158-web-test.log`, `/tmp/158-lint.log`, `/tmp/158-build.log`, `/tmp/158-e2e-typecheck-final.log`, `/tmp/158-typecheck.log`.

## 상태별 계약과 증거

| 상태 | 추가한 검증 | 운영 관찰 |
| --- | --- | --- |
| success | fixture 1건 테이블·건수·조회 버튼 복구 | 미확인 |
| empty | 상태 안내·다른 월/지역 행동·오류 부재·조회 버튼 복구 | 미확인 |
| HTTP error | alert·empty 부재·키보드 재시도·입력 변경 뒤 원래 URL 유지·재시도 거래 표시 | 미확인 |
| client timeout | 실제 요청 보류, clock 10초 안내·44,999ms loading·45,000ms timeout·조회 버튼 복구 | 미확인 |
| 늦은 응답 | abort 실패 이벤트 확인 후 보류 A 해제, timeout 안내 유지 및 재시도 B 유지 각각 검증 | 미확인 |

clock 수정은 제품 상수나 fetch를 교체하지 않는다. 브라우저가 abort한 A의 늦은 route 해제를 검증하며, abort를 무시하는 임의 fetch stub의 경쟁 조건까지 검증했다고 주장하지 않는다. 운영 실응답 테스트는 route mock·clock을 쓰지 않으며 요청 URL·지역·월·응답 상태·시각·종료 UI·버튼 상태·console/pageerror/requestfailed를 JSON attachment에 남긴다. 정상 응답과 복구 UI 통과는 별개다.

증거 원본은 `output/playwright/158-p1/`, `output/playwright/158-p2/`, `output/playwright/158-local-final/`, `output/playwright/158-production/`에 있다. 실패 screenshot·error-context와 상태별 screenshot/요청 JSON attachment를 저장한다. 미도달 상태의 screenshot은 존재한다고 주장하지 않는다. 큰 바이너리는 커밋하지 않는다.

## 발견과 후속 의존

- **P1 Blocking**: 운영 실거래가에서 `참고용이며 법적 효력 없음` 고지를 찾을 수 없다. 두 viewport에서 재현. 현재 소스 SiteHeader에는 고지가 있으므로 #157 배포 소유자가 alias의 실제 SHA와 배포를 확인해야 한다. 이 실행에서 배포 복구·workflow_dispatch를 하지 않았다.
- **P1 Blocking**: success/empty/timeout/error·동일 조건 재시도·버튼 복구·늦은 응답의 운영 수용 증거가 미완료다. 검증 실패를 기대값 완화나 제품 재구현으로 감추지 않았다.
- **P2 Improving / 형제 범위**: 기존 smoke의 청약·favicon 실패는 원본 error-context를 남기고 #122/#128 등 배포 검증과 함께 확인한다. 이 이슈에서 새 제품 수정을 하지 않았다.
- **Skip**: telemetry·신규 차트·직전 거래월 추천·새 디자인·배포 설정 변경·API/DB 변경·브랜치 정리.

법적 고지는 기존 소스 UI에 이미 포함되어 있으며 유지했다. 운영에서 누락된 사실은 위 실패로 남겼다. viewport별 실제 조회·CTA 접근·가로 잘림·시각 확인은 관찰한 범위만 보고하며, 미도달 상태를 완료로 표시하지 않는다.

## 최종 기록

- 실행 예산에 따라 API 전체 테스트와 미완료 브라우저 실행에 SIGINT를 보냈다. 로컬 서버는 종료했다. API exit 130이며 E2E는 전체 완료 결과를 얻지 못했다.
- 로컬 초기 1280px 3건은 컴파일 중 navigation timeout으로 실패했다. 서버가 준비된 뒤 390px success 1건은 통과했다. 전체 GREEN으로 보고하지 않는다.
- 운영 새 실응답 spec은 종료 UI·실제 요청 JSON 결과를 확보하지 못해 미검증이다. 초기 조회 조건(강남구 / 202611)은 screenshot에서만 확인했으며 실제 요청 성공 증거가 아니다.
- P1/P2/P3 태그는 검증 코드 체크포인트다. 운영 수용은 완료되지 않았고 plan 헤딩도 완료로 바꾸지 않았다.
- 모바일 운영 screenshot을 직접 열어 법적 고지 부재와 초기 조회 UI를 시각 확인했다. 오류·timeout CTA와 가로 잘림은 미확인이다.
- 후속 단계는 #157 배포 소유자의 실제 alias SHA 확인 후 준비된 로컬/CI 환경에서 P1/P2 전체, 운영 P3와 API 전체 테스트를 재실행해야 한다.

## stop 이후 재개 체크포인트

- 이전 자동 WIP에서 복원된 staged 증거 38개(실패 screenshot, error-context, interrupted 실행 메타데이터)를 P3 후속 커밋에 보존한다. 과거 실패·중단 기록이며 새 실행의 통과 증거가 아니다. 원래 계획의 바이너리 제외보다 이번 재개 지시의 잔여 보존·커밋 요구를 우선한다.
- 기존 P1/P2/P3 커밋을 기준으로 재개하며 제품 코드·배포 설정·브랜치·worktree를 변경하지 않는다. 추가 실행 결과는 아래에 기록한다.

### 재개 실행 결과 (2026-11-11 KST)

- `npx turbo lint`, `npx turbo build`: exit 0 (각각 5/3 cached tasks). 웹 단위 테스트: exit 0, 11 suites / 51 tests. E2E `tsc --noEmit`: exit 0. workspace typecheck: exit 0. E2E 세 spec `--list`: exit 0, 12 tests.
- API 전체 테스트는 `npm test -w @zipath/api`로 재실행했으나 이 기록 시점에 최종 summary/exit 미확보다. 통과로 보고하지 않는다. 로그: `/tmp/158-resume-api.log`.
- P1/P2 로컬(3102), P3 운영 및 기존 smoke를 재실행했으나 Chromium `chromium_headless_shell-1223` 실행 파일이 캐시에 없어 browserType.launch에서 실패했다. 화면 동작·운영 API의 실패 또는 TDD RED/GREEN 증거가 아니다. 두 브라우저 실행은 중단 요청했다.
- 로컬 개발 서버는 파일 감시 `EMFILE`을 기록했다. polling을 사용한 3103 서버는 95.6초 후 Ready였으나 HTTP 준비 확인은 실패했고 상태 검증을 실행하지 못했다. 서버에는 중단 요청했다.
- 새 환경 실패 증거: `output/playwright/158-resume-local/`, `output/playwright/158-resume-production/`. 실행 로그: `/tmp/158-resume-{local,production,server,server-poll,lint,build,web,typecheck}.log`.
- 제품 UI의 기존 법적 고지 `참고용이며 법적 효력 없음`을 확인했다. 운영에서의 고지·success/empty/timeout/error·버튼 복구·동일 조건 재시도·늦은 응답 검증은 여전히 미완료다. 필요한 브라우저 revision 설치 및 #157 배포 SHA 확인 후 재검증해야 한다. 기대값이나 제품 코드는 변경하지 않았다.

## /code P4 검증 (2026-11-13 KST)

- 소스 SHA `b5b3b4c`, Chromium 148.0.7778.96 revision 1223을 `/tmp/zipath-158-browsers`에 설치. sandbox MachPortRendezvous 거부 후 승인된 sandbox 밖 launch 성공. polling dev server 3115: 컴파일 및 `/real-price` HTTP 200 후 실행.
- RED: 기존 status/timeout 전체 9 passed / 1 failed, exit 1. 390px timeout 재시도에서 첫 방문 쿠키 배너가 클릭을 가로막음. screenshot과 pointer interception 로그로 확인.
- 최소 수정: timeout spec에서 clock 설치 전 실제 `동의` 버튼 클릭. 강제 클릭·제품 timeout·기대값 변경 없음. 쿠키 배너가 열린 상태의 겹침은 P2 Improving으로 보존하며, 동의 후 회복 가능하다.
- GREEN: `PLAYWRIGHT_BROWSERS_PATH=/tmp/zipath-158-browsers PLAYWRIGHT_HTML_OUTPUT_DIR=../../output/playwright/158-code-local-green-report ZIPATH_BASE_URL=http://localhost:3115 npm test -w @zipath/web-e2e -- real-price-status.spec.ts real-price-timeout.spec.ts --workers=1 --output=../../output/playwright/158-code-local-green` → exit 0, 10 passed (39.3s).
- desktop 1280×900 / mobile 390×844: success/empty/error/timeout, 44,999ms loading→45,000ms timeout·조회 enabled·재시도, abort 이벤트, 원래 URL 재시도 B와 A 해제 후 UI 유지 통과. HTTP 오류 재시도는 실제 Tab/Enter 접근 검증. timeout 검증은 쿠키 동의 이후 흐름이다.
- 상태별 screenshot contact sheet를 직접 확인: 기존 법적 고지, 상태 안내, 390px 줄바꿈과 동의 후 timeout CTA 표시. 모바일 거래 테이블은 기존 가로 스크롤 영역이며 상태 안내·CTA의 viewport assertion 통과.
- 증거: `output/playwright/158-code-local/`(RED), `158-code-local-report/`(RED report), `158-code-local-green/`, `158-code-local-green-report/`(GREEN screenshot/요청 JSON). 루트는 모두 `output/playwright/`.
- API 전체: `npm test -w @zipath/api -- --runInBand` exit 0, 20 suites / 217 tests. 웹 전체: 11 suites / 51 tests, exit 0. `npx turbo lint`, `npx turbo build` exit 0 (5/3 cached tasks). workspace typecheck 및 E2E tsc exit 0. 로그 `/tmp/158-code-{api,web,lint,build,typecheck,e2e-typecheck,local,local-green}.log`.
- P4 완료는 로컬 mock 계약에 한정한다. P5 실제 운영 수용은 미완료이며, 아래 후속 기록과 구분한다.

## /code P5 운영 실패 증거 (2026-11-13 KST)

- 명령: `PLAYWRIGHT_BROWSERS_PATH=/tmp/zipath-158-browsers ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- real-price-production.spec.ts production-smoke.spec.ts --workers=1 --output=../../output/playwright/158-code-production` → exit 1, 2 passed / 5 failed (6.0m). mock·clock 없는 실제 조회다.
- URL `https://zipath-web.vercel.app/real-price`, 조건 서울 강남구 `11680` / `202611`, 실제 GET `/api/real-price?LAWD_CD=11680&DEAL_YMD=202611&numOfRows=50`.

| viewport | 실제 요청 UTC | 종료 관찰 UTC | 관찰 결과 |
| --- | --- | --- | --- |
| 1280×900 | 09:11:41.017 | 09:12:28.740 | elapsed 47,775ms, pending, searchEnabled=false |
| 390×844 | 09:14:19.891 | 09:15:07.732 | elapsed 47,893ms, pending, searchEnabled=false |

- 위 시점까지 HTTP 응답·requestfailed 이벤트 없이 대기. 48초 관찰에서도 종료되지 않았으므로 45초 수용 조건 실패다. elapsed는 runner 관찰 값이며 정확한 DOM 전환 시각을 뜻하지 않는다. 버튼 복구·retry CTA·success/empty/error/timeout 종료를 운영에서 관찰하지 못했다. CTA가 없어 동일 조건 재시도 미검증.
- 실제 요청 두 건과 `terminal` JSON을 HTML report에서 확인하여 `output/playwright/158-code-production/{1280px,390px}-observations.json`으로도 보존했다. terminal은 pending 관찰 기록이며 성공 종료가 아니다. 종료 screenshot 수집 중 각 test가 150초 제한에 도달했다. loading/자동 실패 screenshot 및 error-context는 존재하지만 별도 terminal screenshot·trace는 미확보다. 이 부가 수집 실패를 API 성공/실패로 바꾸지 않는다.
- 운영 390px 실패 screenshot을 직접 확인: `조회 중...` disabled·spinner, 상태 설명/재시도/법적 고지 없음. 기존 로컬 UI의 법적 고지는 유지된다.
- 운영 SHA: 읽기 전용 GitHub deployments의 최신 Production 레코드 `4588149208`은 SHA `e42afda31ec08f5969f9796315232ec92f1b9cd9`(2026-05-05), status `inactive`, URL `https://zipath-fp76nizas-sj48695s-projects.vercel.app`. 최신 Preview 레코드 `7689528777`은 `45eff5d45b49a3636740b8c3a8128c8515f720ca`. 어느 것도 현재 production alias SHA를 확정하지 않는다. alias HTTP 200/x-vercel-cache HIT/etag `d32e4a781d1d1285b47e447c3640c59f`만 확인했다. 현재 소스 SHA는 P4 커밋 `f50820f`이며 소스/배포 일치 미확정이다.
- **P1 Blocking:** 두 viewport에서 pending이 제한시간 뒤에도 유지되고 법적 고지 없음. #157 배포 소유자가 실제 alias SHA·승격을 확인한 뒤 재검증해야 한다. 현재 소스의 기존 timeout을 재구현하지 않았다.
- **P2 Improving / 형제 범위:** 기존 smoke는 홈 렌더링·실거래가 직접 접근 2건 통과, 홈 법적 고지·청약 필드·favicon(404) 3건 실패. 실제 조회 spec에는 각 viewport에서 React #425×5/#418/#423 pageerror가 기록됐다. 짧은 직접 접근 smoke의 통과로 긴 실제 조회의 오류를 부정하지 않는다. #122/#128 범위로 증거 보존.
- **Skip:** telemetry·신규 차트·새 UI·배포 변경·workflow dispatch·worktree/브랜치 정리. P5 실행은 마쳤으나 운영 수용은 미완료다. 완료 헤딩으로 바꾸지 않는다.
- 증거: `output/playwright/158-code-production/`, `output/playwright/158-code-production-report/` (screenshot/HTML 내 JSON), `/tmp/158-code-production.log`, `/tmp/158-prod-headers.txt`. 새 바이너리는 커밋하지 않는다.
- 최종 전체 검증: API 20 suites / 217 tests, web 11 suites / 51 tests, turbo lint/build, workspace typecheck, E2E tsc 모두 exit 0. 변경 후 lint·typecheck/E2E tsc도 exit 0. `git diff --check` 통과. P5 운영 실패와 분리한다.


## 코드 리뷰 및 P6 (2026-11-13 KST)

기준 브랜치 HEAD `5d56c465636d0f826187c58ef451225913c02a0e`, `origin/develop...HEAD` 변경분과 호출 경로를 대조했다. 플랜/이슈에 `## Spec` 또는 S#가 없어 최신 수용 조건 및 11월 13일 범위를 기준으로 검토했다. 다음 번호는 리뷰용 수용 조건 번호다. 운영 통과 또는 이슈 종료를 승인하지 않는다.

### 발견과 수정

- **P1 Blocking / 검증 코드:** pending에서 버튼 이름이 `조회 중...`으로 바뀐다. 종료 기록의 `조회` locator `isEnabled()`가 대상을 기다려 48초 관찰 실패를 150초 테스트 만료로 확대했다. 이 증거용 검사에 1초 제한을 적용했다.
- **P2 Improving / 검증 코드:** 부가 스크린샷에 별도 제한이 없고 캡처 실패가 재시도/JSON 수집을 중단한다. 캡처를 5초로 제한하고 실패 이벤트를 남긴다. 최초 진단의 캡처 지연 외에 위 locator 대기가 직접 원인임을 재실행으로 확인했다.
- **P2 Improving / 검증 코드:** 재시도 측정 시작점에 스크롤·탭 탐색 시간이 포함됐다. Enter 직전부터 측정한다. 새 배포의 쿠키 배너가 390px 재시도 클릭을 막지 않도록 기존 timeout 검사의 실제 동의 절차를 적용한다.
- 제품 코드는 기존 디자인 토큰·헤더·조회/오류 UI와 공통 API 경로를 읽어 확인했다. 로컬에서 재현된 제품 결함이 없어 수정하지 않았다. 데이터 쓰기·DB·API 계약 변경은 없다.

### 수용 조건 대조

- S1: 미충족(운영) — 정상 응답의 테이블/empty는 `real-price-status.spec.ts`의 두 viewport 모의 응답에서 통과했다. 실제 운영 조회는 종료를 확인하지 못했다.
- S2: 미충족(운영) — `real-price-timeout.spec.ts`에서 44,999ms loading/45,000ms 버튼 복구·재시도가 통과했다. 실제 운영 pending은 제한시간 뒤에도 유지된다.
- S3: 충족(로컬 계약) — status/timeout spec에서 empty·HTTP 오류·timeout 메시지와 상호 배타 조건을 검증했다. 운영에서 해당 세 종료 상태를 관찰한 증거는 없다.
- S4: 미충족(운영) — 로컬 390px 상태 안내·재시도 CTA·키보드는 통과했다. 운영은 종료 안내·CTA가 없어 수용 미완료다.
- S5: 충족(검증 코드) — 기존 status/timeout spec의 success/empty/timeout/error 10건 통과. 실제 운영과 모의 결과는 아래처럼 분리한다.

### 리뷰 검증

- 준비된 서버: `WATCHPACK_POLLING=true npm run dev -w @zipath/web -- --port 3116`, `/real-price` 컴파일 완료 및 HTTP 200 확인 후 실행.
- 로컬 모의 응답: `PLAYWRIGHT_BROWSERS_PATH=/tmp/zipath-158-browsers ZIPATH_BASE_URL=http://localhost:3116 npm test -w @zipath/web-e2e -- real-price-status.spec.ts real-price-timeout.spec.ts --workers=1 --output=../../output/playwright/158-review-local` → exit 0, **10 passed (9.0s)**. 상태별 캡처를 직접 확인했고 390px의 안내·동의 후 timeout CTA 줄바꿈/가로 잘림에 추가 결함은 없었다.
- 증거 수집 자체 검사: 임시 `158-review-check.spec.ts`에서 운영 spec의 페이지 리소스를 준비된 로컬 서버로 전달하고, 첫 캡처 실패 및 HTTP 500→empty 응답을 주입했다. `screenshot-error` 1개와 terminal `[error, empty]`를 assertion으로 확인, 두 viewport **2 passed (28.0s), exit 0**. 실제 운영 API 증거가 아니다. 임시 파일은 테스트 검색 대상에서 제거하고 `output/playwright/158-review-self-check.ts`에 보존했다.
- E2E `npx tsc --noEmit -p apps/web-e2e/tsconfig.json` → exit 0. `git diff --check` 확인. 제품 코드가 바뀌지 않아 API/웹 전체 테스트·전체 빌드를 반복하지 않았다.
- 최초 브라우저 launch는 sandbox MachPort 거부로 실패했다. 승인된 sandbox 밖 Chromium으로 실행한 위 결과와 구분한다.
- 첫 운영 재실행은 두 건 모두 150초 테스트 제한으로 실패했다. 부가 캡처 제한만으로 해결되지 않아 `조회` locator의 대기 원인을 확인하고 1초 제한을 추가했다. 이 실행을 성공으로 계산하지 않는다.
- 로컬 아티팩트: `output/playwright/158-review-local{,-report}/`, 자체 검사: `158-review-self-check{,-report}/`, 첫 운영: `158-review-production{,-report}/`. 새 바이너리는 커밋하지 않는다.


### 수정 후 실제 운영 결과

`PLAYWRIGHT_BROWSERS_PATH=/tmp/zipath-158-browsers ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- real-price-production.spec.ts --workers=2 --output=../../output/playwright/158-review-production-final` → **exit 1, 2 failed**. 테스트는 각각 54.2초/54.1초에 종료되어 기존 150초 만료가 사라졌고, 종료 캡처와 실제 요청/terminal JSON을 모두 보존했다. JSON 추출 후 두 테스트가 60초 안에 종료되고 pending·searchEnabled=false를 기록했는지 assert 자체 검사도 통과했다. 검증 코드 수정의 효과이며 운영 UI 성공이 아니다.

| 화면 | 실제 요청 UTC | 종료 관찰 UTC | 경과(관찰값) | 결과 |
| --- | --- | --- | --- | --- |
| 1280×900 | 2026-11-13 14:46:24.320 | 14:47:12.039 | 47,764ms | pending, 조회 비활성 |
| 390×844 | 2026-11-13 14:46:24.320 | 14:47:11.912 | 47,639ms | pending, 조회 비활성 |

- 조건: 서울 강남구 `11680` / `202611`, 실제 `/api/real-price?LAWD_CD=11680&DEAL_YMD=202611&numOfRows=50`. 관찰 시점까지 HTTP 응답/requestfailed 없음. 종료 기록 이름 `terminal`은 성공 종료를 뜻하지 않는다.
- 390px 실패 캡처를 직접 확인: 조회 중 비활성 버튼·spinner 유지, 상태 안내·timeout·재시도·법적 고지 없음. 두 viewport의 법적 고지 assertion도 실패했다. 따라서 **S1/S2/S4 운영 미충족**, 이슈 수용/승인 보류다. CTA가 없으므로 운영 재시도와 운영 네 종료 상태는 미검증이다.
- 소스/운영 SHA 일치는 확정하지 못했다. 운영에서 현재 소스에 있는 고지·상태 안내가 보이지 않아도 배포 원인을 추측하여 제품 timeout을 재구현하지 않는다. 배포 소유자의 실제 alias/SHA 확인 후 운영을 재검증해야 한다. 이번 요청 범위에 배포 변경은 없다.
- 증거: `output/playwright/158-review-production-final/1280px-observations.json`, `390px-observations.json`, 같은 디렉터리의 두 실패 캡처, `158-review-production-final-report/`의 loading/종료 캡처·JSON. React #425×5/#418/#423도 두 실행에 남아 있으며 #128 형제 범위로 분리한다.
- 제외: telemetry·신규 차트·직전 거래월 추천·공유 API 재구현·전체 테스트/빌드·배포. 검증 코드 수정만 커밋하며 운영 미충족을 통과로 바꾸지 않는다.

## /code P7 운영 배포 식별 (2026-11-14 KST)

- 기준 소스: `2a3413bb13d90b5a14059c43a9f7f3618547c722`. 복원된 실패 증거 8개와 옆 log는 `964d7ca` (`#158 [P5]`)에 보존했다. 새 성공 증거가 아니다.
- 읽기 전용 `GET https://zipath-web.vercel.app/real-price`: HTTP 200, `x-vercel-cache: HIT`, ETag `d32e4a781d1d1285b47e447c3640c59f`, 11,817 bytes. HTTP Date `Fri, 13 Nov 2026 16:31:25 GMT` (KST 11월 14일). 이전 운영 실패 기록과 ETag가 같다. 동일 ETag는 현재 alias SHA의 증명이 아니다. 헤더/HTML은 `/tmp/158-p7-headers.txt`, `/tmp/158-p7-production.html`.
- [GitHub Production deployments](https://api.github.com/repos/sj48695-labs/zipath/deployments?environment=Production&per_page=3)의 최신 레코드는 여전히 ID `4588149208`, SHA `e42afda31ec08f5969f9796315232ec92f1b9cd9`, 생성 `2026-05-05T21:11:10Z`. [최신 status](https://api.github.com/repos/sj48695-labs/zipath/deployments/4588149208/statuses)는 `inactive`, 시각 `2026-05-05T21:13:47Z`, environment URL `https://zipath-fp76nizas-sj48695s-projects.vercel.app`. alias 연결 근거가 없다.
- PR #163 병합 SHA `8bf8c6858e1633f6ac0ee022c64dd4abab844dc8`의 deployment `7768441680`은 **Preview**, 생성 `2026-11-13T15:00:29Z`. [status](https://api.github.com/repos/sj48695-labs/zipath/deployments/7768441680/statuses)는 success, URL `https://zipath-kj4sq9r48-sj48695s-projects.vercel.app`. 최신 조회 레코드 `7768624467` (`406af1bf220ccbc5e5e1aea71b1344b3330f53ea`, `2026-11-13T15:08:03Z`) 역시 Preview다. 이 URL·SHA들을 Production alias로 취급하지 않는다.
- `vercel inspect https://zipath-web.vercel.app`는 인증 정보가 없어 조회 결과 대신 로그인 흐름을 시작했다. 인증 진행 없이 SIGINT 종료(exit 130). 접근 가능한 메타데이터만으로 실제 alias SHA·배포 시각을 확정할 수 없다.
- 소스 `SiteHeader.tsx`에는 정확한 `참고용이며 법적 효력 없음` 고지가 있다. 이번 운영 HTML에는 해당 문자열이 없다. HTML 관찰이며 새 desktop/mobile 브라우저 시각 검증은 아니다. 기존 디자인·제품 코드는 수정하지 않았다.
- **P1 Blocking:** 운영 배포 확인이 필요하다. 소유자가 현재 alias 연결 SHA·배포 URL·시각을 확인한 뒤 P8을 재개한다. 배포·승격·workflow dispatch·PR 조작은 수행하지 않았다.
- **Skip:** 같은 배포인지 확인되지 않은 상태의 기존 pending 실조회 반복, telemetry·신규 차트·추측성 제품 수정. P7 조사 완료는 운영 수용 완료가 아니다. P5/P8은 미완료이며 success/empty/timeout/error·45초 종료·버튼 복구·재시도에 새 운영 통과 증거는 없다. 기존 로컬 mock 계약과 과거 실패 증거는 유지한다.

- 이번 호출 최종 검증: `npm test -w @zipath/api` exit 0 (20 suites / 217 tests), `npm test -w @zipath/web -- --runInBand` exit 0 (11 suites / 51 tests). `npx turbo lint` exit 0 (5 cached tasks), `npx turbo build` exit 0 (3 cached tasks). `npm run typecheck --workspaces --if-present`, `npx tsc --noEmit -p apps/web-e2e/tsconfig.json`, `git diff --check` 모두 exit 0.
- 로그: `/tmp/158-code-resume-{api,web,lint,build,typecheck,e2e-typecheck}-final.log`. P7은 문서·배포 식별만 수행해 새 로직/TDD RED-GREEN 대상이 없었다. 기존 상태 검증 테스트는 보존했으며 P8의 배포 조건 미충족으로 브라우저 운영 검증을 재실행하지 않았다.

## 두 번째 코드 리뷰: 45초 계약의 오탐 수정 (2026-11-14 KST)

검토 기준은 `01942a8`의 `origin/develop...HEAD`다. 브랜치 차이는 운영 배포 조사 문서·계획·과거 실패 증거이며, 기존 상태 검증 코드는 develop에 이미 병합됐다. 플랜에 `## Spec`/S#가 없어 아래 S1~S5는 최신 이슈 수용 조건 순서로 부여했다. 기존 구현·호출 경로와 상태 검증을 읽었으며 신규 제품 기능은 추가하지 않았다.

### 발견과 수정

- **P2 Improving / 검증 코드:** `real-price-production.spec.ts`가 48초 관찰 안에 종료되면 45초 계약 위반도 통과시킨다. 동일한 모의 페이지에 응답을 47초 지연시켰을 때 수정 전 desktop/390px **2 passed, exit 0**으로 재현했다. 이는 운영 API 성공 증거가 아니다.
- 최소 수정: 기존 spec 안에서 `MutationObserver`로 조회 버튼의 비활성 시작·복구를 측정한다. `performance.measure`의 실제 지속시간을 JSON 이벤트에 남기고 45,000ms 이내인지 검증한다. 48초는 종료 증거 수집 여유로만 유지한다. soft assertion으로 제한시간 위반을 실패로 남기면서 오류 후 재시도 증거도 수집한다. 측정값 부재도 실패다.
- 같은 47초 모의 응답은 수정 후 desktop **47,017.1ms**, 390px **47,017.8ms**로 측정되어 **2 failed, exit 1**이다. 실패 원인은 새 45초 assertion이며 정상적인 회귀 검출 결과다.
- 100ms 모의 정상 응답 **2 passed, exit 0**. 100ms HTTP 500 → 같은 URL의 empty 재시도도 **2 passed, exit 0**. 모두 desktop 1280×900 / mobile 390×844에서 기존 production spec을 임시 모의 페이지로 실행했다. 실제 운영 조회·원래 앱 화면의 네 상태 재검증과 구분한다.
- 기존 토큰(`globals.css`), 헤더·법적 고지(`SiteHeader.tsx`), `page.tsx`·`real-price-error.ts`·프록시·공통 API와 호출자를 확인했다. 제품·공유 API·디자인·배포·워크플로는 수정하지 않았다. 조회는 읽기 전용이며 DB 쓰기나 응답 계약 변경은 없다.

### 수용 조건 대조

- S1: 미충족(운영 수용) — `real-price-status.spec.ts`의 success/empty 로컬 10건 중 해당 시나리오는 기존 P4에서 통과했다. 운영 정상 응답의 테이블/empty 종료는 기존 P5/P6 이후 새 증거가 없다.
- S2: 미충족(운영 수용) — `real-price-timeout.spec.ts`의 44,999ms/45,000ms·버튼 복구·재시도·늦은 응답 검증은 기존 P4에서 통과했다. 이번 수정은 운영 검사에서 45초 위반을 놓치던 문제를 해결했으며 운영 pending 자체의 해소는 증명하지 않는다.
- S3: 충족(로컬 검증 계약) — status/timeout spec에서 empty와 timeout을 서로 다른 메시지로 검증한다. 기존 P4 통과 근거를 유지하며 실제 운영의 두 종료 상태는 미관찰이다.
- S4: 미충족(운영 수용) — status/timeout spec의 기존 390px 안내·CTA·키보드 검증은 통과했다. 운영 종료 안내·CTA는 기존 P5/P6에서 부재했고 새 운영 증거가 없다.
- S5: 충족(검증 코드) — 기존 `real-price-status.spec.ts`·`real-price-timeout.spec.ts`의 success/empty/timeout/error 10건 및 P4 통과 기록이 있다. 이번에는 변경한 production spec의 시간 측정과 재시도만 검증했다.

운영 S1/S2/S4가 남아 있으므로 전체 수용 판정은 보류한다. 검증 코드 수정 완료를 운영 통과로 취급하지 않는다. 운영 배포 확인과 승격은 이번 리뷰 범위 밖이며, 미충족 조건을 추측성 timeout 재구현으로 바꾸지 않는다.

### 환경·운영 관찰과 검증 범위

- 읽기 전용 운영 `/real-price`는 HTTP 200, ETag `d32e4a781d1d1285b47e447c3640c59f`, 11,817 bytes였다. HTTP Date `Fri, 13 Nov 2026 16:36:10 GMT`. P7과 ETag가 같고 새 배포·alias SHA 근거는 없다. 이는 조회 요청의 성공 증거가 아니다. P8의 배포 확인 조건을 유지하며 같은 운영 pending 실조회를 반복하지 않았다.
- 브라우저는 `/tmp/zipath-158-browsers`의 revision 1223을 사용했다. 기본 환경의 존재하지 않는 경로로 한 번 실행 실패했고, 명시 경로에서는 sandbox MachPort 권한으로 실패했다. 승인된 sandbox 밖 launch 후 검증했다. 초기 모의 페이지는 인코딩·select 구조 오류로 두 차례 준비 실패했으며 이후 원본과 수정본을 같은 페이지로 비교했다. 이 준비 실패들은 제품 결과가 아니다.
- `npx tsc --noEmit -p apps/web-e2e/tsconfig.json` exit 0. `git diff --check` 통과. 제품을 수정하지 않아 전체 테스트·빌드는 반복하지 않았다. 현재 로컬 mock 네 상태 10건도 변경하지 않아 반복하지 않았다.
- 로그: `output/playwright/158-review-contract.log`. 재현 소스: `output/playwright/158-review-contract-check.ts`. 새 스크린샷·HTML 보고서는 텍스트 결과 보존 후 제거했으며 커밋하지 않는다.

재현 소스를 `apps/web-e2e/tests/158-review-contract-check.spec.ts`로 임시 복사한 후 아래 명령으로 실행한다. 기본 47초 응답은 **exit 1 / 2 failed**여야 하며, `REVIEW_RESPONSE_DELAY_MS=100`이면 **exit 0 / 2 passed**여야 한다. `REVIEW_FIRST_ERROR=1 REVIEW_RESPONSE_DELAY_MS=100`은 HTTP 오류 후 동일 조건 재시도다. 완료 후 임시 spec을 제거한다. 원본 비교는 수정 전 spec을 임시 파일로 복사해 import 대상을 바꿔 실행했다.

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/zipath-158-browsers ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- 158-review-contract-check.spec.ts --workers=2
```

이 명령의 URL은 production spec의 대상 제한을 유지하기 위한 것이며, 재현 소스는 페이지와 API를 모의 응답으로 대체한다. 실제 운영 결과로 기록하면 안 된다.
