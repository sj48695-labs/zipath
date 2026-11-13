# #158 plan 조사·실행 기록

이 파일은 재개·검증 증적이다. `/plan`·`/code`의 기본 설계 입력은 옆 `158-real-price-state-verification.md`이며, 이 기록은 특정 증거가 필요할 때 해당 절만 읽는다.

## 기존 plan에서 분리한 조사 결과의 한계 (2026-11-11)

아래는 당시 기록 원문이다. “기존 plan 없음”, 테스트 미작성 등 당시 시점의 서술을 현재 상태로 해석하지 않는다.


- #158의 closed/reopened timeline 이벤트는 없고 기존 `plans/158-*`도 없다. #158 관련 제품 변경이 완료됐다고 판단하거나 이슈를 종료하지 않는다.
- 최신 production regression 실행 https://github.com/sj48695-labs/zipath/actions/runs/35434014334 은 `VERCEL_TOKEN` 누락으로 deployment 확인 단계가 실패했고 smoke는 skipped다. 이 기록만으로 현재 운영 SHA를 확정할 수 없다. 자동 복구 workflow를 재실행하거나 배포 설정을 바꾸지 않는다.
- GitHub Production deployment 메타데이터의 최신 반환 SHA는 `e42afda31ec08f5969f9796315232ec92f1b9cd9`였다. 이것만으로 Vercel alias의 현재 SHA라고 단정하지 않는다.
- PM 회의록 `/tmp/pm-meeting-s8iAtT`는 현재 환경에 없다. 사용자 제공 지침과 실제 조회한 최신 이슈 댓글을 사용한다.
- plan 조사 중 Playwright CLI 실행을 시도했다. 기본 npm/daemon 캐시 쓰기 실패 후 `/tmp` 캐시로 바꿔 실행했으나 Chrome이 시작 중 `SIGABRT`로 종료했다. 운영 화면·조회·screenshot은 확보하지 못했고, P1~P3 테스트도 아직 실행하지 않았다. 브라우저 시작 실패를 제품 장애로 분류하지 않는다.


## 기존 /code 실행 기록 (2026-11-11)


- P1/P2 검증 spec을 작성하고 targeted test를 실행했다. 운영은 현재 소스와 다른 UI를 제공하여 수용 조건은 미완료다. `[PN]` 체크포인트는 검증 코드 작성의 기록이며 운영 수용 완료를 뜻하지 않는다.
- P2의 최초 실행에서 발견한 clock.pauseAt 기준시각 오류는 고정 시각 설치 후 1초 미래에 정지하도록 수정했다.
- 브라우저 기본 경로 부재 → 설치 캐시 지정 → sandbox MachPort 권한 오류를 확인하고 승인된 sandbox 밖 Chromium으로 실행했다.
- 운영 실패를 제품 수정이나 기대값 완화로 숨기지 않는다. 실행 결과는 `docs/verification/158-real-price.md` 참조.

- P3 운영 spec·workflow 실행 목록·검증 보고서 작성. API와 E2E는 실행 예산으로 중단한 항목이 있어 전체 검증은 미완료다. 웹 단위 51개·E2E 타입 검사·DB typecheck·lint·build는 통과했다.

- stop 재개: 잔여 증거 38개를 `e0f1d20`의 P3 정식 커밋으로 보존했다. lint/build/웹 51개/타입 검사는 통과했다. 브라우저 재실행은 필요한 Chromium revision 1223 부재로 launch 실패하여 운영 수용은 미완료로 유지한다. 최신 세부 기록은 검증 보고서의 재개 실행 결과를 따른다.


## /plan 재검토 (2026-11-13 KST)

- 최신 본문과 모든 댓글을 `gh issue view 158 --json number,title,body,comments,updatedAt,state,labels`로 확인했다. 최신 갱신은 2026-11-13T05:59:08Z, 회의 댓글은 https://github.com/sj48695-labs/zipath/issues/158#issuecomment-6845472449 이다.
- 변경점: 기존 계획은 11/11 댓글 기준이었다. 11/13 댓글은 동일한 축소 범위를 재확인하고 `page.tsx`, `real-price-error.ts`, API route 재사용 및 재현 결함만 수정할 것을 명시했다. 접속 audit를 조회 성공 증거로 쓰지 않는 조건도 유지했다.
- #157 CLOSED(2026-10-02), 로컬 이력의 PR #159 merge `78e2077` 확인. #158 timeline에 closed/reopened 이벤트는 반환되지 않았다.
- 시작 HEAD `84a25af`, 원격 브랜치 SHA는 `git ls-remote`로 사용자 제공 `45eff5d45b49a3636740b8c3a8128c8515f720ca`와 일치함을 확인했다. SHA 차이를 덮기 위한 fetch/rebase/reset/push는 수행하지 않았다.
- `gh pr list --head ...` 및 전체 상태의 `158` 검색 모두 PR을 반환하지 않았다. PR을 새로 만들거나 상태를 변경하지 않았다.
- P1 `4a2910b`, P2 `dd3c571`, P3 `c87d8b0`와 후속 `e0f1d20`·`84a25af`의 구현 체크포인트를 보존했다. 기존 문서가 미완료로 남긴 수용 조건은 새 P4/P5에 이관했다. 완료 마커는 코드 작성·커밋만 가리키며 테스트 통과를 뜻하지 않는다.
- 특정 실패 원인을 확인하기 위해 `docs/verification/158-real-price.md`의 실행·재개 절을 읽었다. 필요한 Chromium revision 1223 부재, EMFILE/서버 준비 실패, 조회 전 법적 고지 assertion 실패 때문에 결과를 확보하지 못했다. 새로운 실행에서도 같은 실패 경로를 그대로 반복하지 않도록 P4에 환경 선확인, P5에 독립적인 실제 조회 증거 수집 조건을 반영했다.
- PM 원문 `/tmp/pm-meeting-ww5VhN`은 존재하지 않았다. 사용자 제공 PM 지침과 최신 GitHub 댓글을 사용했다.
- 자체 검토 2회: 최신 지침 대비 범위, 완료 커밋 보존, phase 크기, 운영/mock 구분, 45초와 assertion 여유 구분, 재현 결함의 조건부 phase, 기록 분리 및 명시적 stage를 점검했다.
- plan 재작성 완료. 이번 실행은 문서만 변경하며 브라우저·제품 테스트·배포·Ready·merge·auto-merge·정리는 수행하지 않았다. 문서 검사는 커밋 전 diff로 확인한다.

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


## 2026-11-13 코드 리뷰 P6

- 기준 HEAD `5d56c46`. Spec/S# 없음: 최신 수용 조건으로 대조. 제품 재현 결함 없이 검증 코드의 대기·캡처·측정 문제만 수정했다.
- RED: 운영 두 건에서 48초 관찰 실패 뒤 증거용 `조회` 버튼 isEnabled가 150초까지 대기. pending 중 이름은 `조회 중...`이다.
- 수정: 증거용 isEnabled 1초 제한, 부가 캡처 5초 제한/오류 이벤트, 쿠키 실제 동의, 재시도 Enter 직전 측정 시작.
- 로컬 기존 10건 통과(exit 0, 9.0초). 캡처 실패+HTTP 오류→재시도→empty 주입 2건 통과(exit 0, 28.0초), 운영 성공 증거로 쓰지 않는다. E2E tsc/diff 검사 통과. 새 전체 테스트/빌드는 실행하지 않았다.
- 최종 운영은 2 failed(exit 1): 두 viewport pending. 각 54.2초/54.1초에 종료하고 실제 요청/terminal JSON·캡처 보존. 60초 이내 종료와 pending JSON 보존 assert 통과로 검증 코드 대기 수정은 확인했다.
- 운영 S1/S2/S4 미충족, S3 로컬 메시지 계약과 S5 네 상태 E2E는 충족. P5 운영 수용 미완료를 유지한다. 배포·telemetry·차트·제품 timeout 재구현 없음.
- 상세 명령/요청 시각/미검증/아티팩트는 `docs/verification/158-real-price.md`의 코드 리뷰/P6 절 참조. 새 바이너리는 커밋하지 않는다.


## /plan 갱신 (2026-11-14 KST, DCD9BFAC)

- 최신 #158 본문/전체 댓글, #157 CLOSED, PR #163 MERGED 및 CI를 읽기 전용 확인. PR 병합 SHA `8bf8c6858e1633f6ac0ee022c64dd4abab844dc8`, 최신 develop 조회 SHA `406af1bf220ccbc5e5e1aea71b1344b3330f53ea`. 최근 deployment 5건은 Preview이며 현재 alias의 Production SHA 증거가 아니다.
- reply로 제거된 plan을 `56c5a20^`에서 복원해 설계·기존 phase를 보존하고 P7 배포 식별/P8 실제 운영 검증을 추가했다. 과거 실패 원인 확인을 위해 이 log의 P5/P6 절만 읽었다. 기존 로컬 GREEN과 운영 pending 미완료를 구분했다.
- PM 원문 `/tmp/pm-meeting-ww5VhN`은 파일 없음. 사용자 제공 PM 지침과 최신 GitHub PM 댓글로 범위를 확인했다. 추측으로 회의록을 보충하지 않았다.
- dirty index에 기존 운영 실패 증거 8개가 있어 rebase하지 않았다. 작업 디렉터리 전환·정리 없음. 제품 코드/테스트 실행/배포/PR 변경 없음. ui-design match mode와 ponytail 적용, 직접 탐색으로 완료.
- plan 자체 검토 2회: 최신 범위·phase 크기/의존·정확한 심볼/선례·45초 기준·운영/mock 구분·기록 보존 확인. plan 갱신 완료이며 이슈 수용은 미완료다.
