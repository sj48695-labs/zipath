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
