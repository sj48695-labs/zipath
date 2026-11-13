# #122 청약 운영 복구 검증 체크포인트

검증일: 2026-11-11 02:24–02:32 KST. **BLOCKED: 운영 배포 SHA 확인/복구 필요. 운영 수용 조건 미완료.**

기능 재구현 없이 `subscription-recovery.spec.ts`에 desktop 1280×900 / mobile 390×844 각각 대기 후 성공, 네트워크 실패 후 동일 입력 재시도, 실제 45초 취소 후 재시도 사례를 추가했다. 제품 코드·API·DB·의존성·CI·Hold PR #155·형제 이슈 #128/#158은 변경하지 않았다.

## 소스와 운영 배포

- 테스트 기반 HEAD: `f99d2cd` (기능 기반 `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`). 조회한 develop도 `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`.
- 운영 URL: https://zipath-web.vercel.app/subscription — HTTP 200. `x-vercel-id: icn1::wpfzf-1794331444759-c76810a08596`. 이 요청 ID는 deployment ID나 source SHA가 아니다.
- 실제 운영 source SHA / deployment ID: **확인 불가**. `vercel inspect`는 `The specified token is not valid`로 실패했다. 토큰·배포 변경은 하지 않았다.
- GitHub 마지막 Production deployment: ID `4588149208`, SHA `e42afda31ec08f5969f9796315232ec92f1b9cd9`, 생성 2026-05-05, 최신 상태 `inactive`. 당시 URL은 https://zipath-fp76nizas-sj48695s-projects.vercel.app . 현재 alias SHA의 증거로 사용하지 않는다.
- 최신 [Production web regression](https://github.com/sj48695-labs/zipath/actions/runs/35434014334)은 failure, 운영 smoke는 skipped. 이번 실행에서 workflow를 dispatch하지 않았다. #157 후속 배포 복구 및 SHA 확인이 필요하다.

## 실행 결과

| 검증 | 결과 |
| --- | --- |
| `npm test -w @zipath/web -- --runInBand` | PASS: 11 suites / 51 tests |
| `npx tsc --noEmit -p apps/web-e2e/tsconfig.json` | PASS (exit 0) |
| `npx turbo lint` | PASS: 5 tasks, Turbo cache |
| `npx turbo build` | PASS: 3 tasks, Turbo cache; 신규 E2E는 별도 tsc로 검사 |
| `npm test -w @zipath/api` | 실행 후 예산 내 종료 결과를 얻지 못해 중단(exit 130); PASS로 판정하지 않음 |
| 운영 복구 spec | desktop 3개 및 mobile 대기 사례가 beforeEach 법적 고지 검사에서 실패. 나머지는 실행 중단으로 미확인. 복구 동작 assertion까지 도달하지 못했으므로 10초/45초/재시도 성공 증거가 아님 |
| 로컬 복구 spec | 첫 desktop 사례는 beforeEach `page.goto` 중 30초 테스트 예산 초과, 두 번째도 실패. 나머지는 중단으로 미확인; GREEN 미확인 |
| 운영 mock 없는 요청 | POST 전송 후 60.6초 동안 응답/결과/복구 안내 미관찰 |

재현 명령:

```sh
PLAYWRIGHT_BROWSERS_PATH=/Users/sujeong/Library/Caches/ms-playwright \
ZIPATH_BASE_URL=http://127.0.0.1:3124 npm test -w @zipath/web-e2e -- \
subscription-recovery.spec.ts --project=chromium --workers=1 --retries=0 \
--output=../../output/playwright/122/local --reporter=list

PLAYWRIGHT_BROWSERS_PATH=/Users/sujeong/Library/Caches/ms-playwright \
ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- \
subscription-recovery.spec.ts --project=chromium --workers=1 --retries=0 \
--output=../../output/playwright/122/production
```

Chromium은 기본 환경의 존재하지 않는 browser 경로 대신 설치된 캐시를 지정하고, macOS MachPort sandbox 제한을 해소한 실행에서 기동했다. 로컬 Next는 `apps/web`에서 3124 포트로 실행했다. 첫 페이지 컴파일이 길어져 beforeEach가 실패했다. 테스트 예산을 늘려 제품 동작 성공으로 포장하지 않았다.

## 운영 관찰과 증거

- **P0:** mock 없이 desktop에서 age=31, income=4500, homelessMonths=24, dependents=2로 제출했다. 실제 POST URL은 `https://zipath-api.onrender.com/api/subscription/simulate`. 60,645ms 후에도 `확인 중...`이며 응답 상태·결과·timeout·재시도는 관찰되지 않았다. 네트워크를 제어하지 않은 실제 요청 한 번이며 정상 성공은 미확인이다.
- **P1:** 초기 화면에 청약통장 가입기간 및 필수 고지 `참고용이며 법적 효력 없음`이 보이지 않는다. 기존 로컬 소스에는 두 항목이 있다. 이 차이만으로 운영 배포 SHA를 특정하지 않는다.
- **P2:** 복구 화면까지 도달하지 못하여 모바일 접근성·가로 넘침·재시도 버튼 접근성은 미검증.
- **Skip:** 새 디자인이나 시각 취향에 따른 변경은 하지 않았다.

로컬 artifact 경로(재개 시 사용자가 staged 잔여 보존을 명시하여 기존 바이너리도 `3c10504`에 보존):

- `output/playwright/122/live/initial.png`: 운영 desktop 초기 화면. 직접 열어 청약통장·법적 고지 부재 확인.
- `output/playwright/122/live/after-submit.png`: 운영 실제 요청 60초 이후 상태.
- `output/playwright/122/production/`: 운영 실패 screenshot 및 error-context. desktop snapshot에 기존 단순 헤더·입력 4개·체크박스 2개만 관찰됨.
- `output/playwright/122/local/`: 로컬 테스트 실패 context 및 생성된 attachment.
- `/tmp/122-{local-e2e,production-e2e,api-test,web-test,lint,build,typecheck,live}.log`: 이번 실행 로그. 임시 로컬 증거이며 외부에 게시하지 않았다.

기존 구현을 바꾸거나 배포 복구를 수행하지 않는다. 후속 검토는 중단한 API 전체 테스트를 다시 실행하고, 로컬 서버 준비 후 6개 사례의 GREEN을 확보해야 한다. 운영 SHA 확인/복구 후 같은 spec과 mock 없는 실제 성공을 재검증해야 한다. `[P1]`/`[P2]` 커밋은 미완료 작업 체크포인트이며 운영 PASS를 뜻하지 않는다.

Skills used: code, ponytail(full), ui-design(match), playwright.

## 2026-11-11 재개 검증

- 재개 소스: `0884b07`, staged 증거 보존 커밋: `3c10504`. 기존 테스트와 구현을 유지했다. 문서의 과거 실패는 이번 PASS로 덮어쓰지 않는다.
- targeted: `npm test -w @zipath/web -- --runInBand src/app/subscription/subscription-error.test.ts src/lib/__tests__/api.test.ts` — PASS, 2 suites / 26 tests.
- `npx tsc --noEmit -p apps/web-e2e/tsconfig.json` — PASS, exit 0.
- `npx turbo lint` — PASS, 5/5 tasks cached. `npx turbo build` — PASS, 3/3 tasks cached. 로그: `/tmp/122-resume-{lint,build,typecheck}.log`.
- 빌드 서버 `http://127.0.0.1:3127/subscription` SSR 응답에 `참고용이며 법적 효력 없음`과 기존 상세 고지가 모두 포함되어 있다. 필수 고지가 로컬에 없다는 판단이나 문구 수정은 필요하지 않다. 운영 고지 존재를 뜻하지 않는다.
- 첫 재실행은 Playwright가 요구하는 `chromium_headless_shell-1223` 미설치로 실패했다. 전역 캐시나 의존성을 변경하지 않고 `/tmp/122-pw.config.ts`에서 설치된 `chromium_headless_shell-1226` 실행 파일을 지정했다. 새 브라우저 설치 시도도 `/tmp`에만 한정했다.
- 이 임시 설정으로 network 2개와 전체 로컬 6개, 운영 6개를 실행했다. 로컬 network desktop 실행에서 HTTP 500과 실패가 관찰됐다. 개발 서버와 build/start가 같은 `.next`를 사용하는 경합이 발견되어 이번 실행의 개발 서버 둘을 중지했다. 환경 오류를 제품 결함이나 GREEN 증거로 간주하지 않는다.
- 실행 명령: `ZIPATH_BASE_URL=http://127.0.0.1:3127 node node_modules/@playwright/test/cli.js test --config /tmp/122-pw.config.ts subscription-recovery.spec.ts --workers=1 --retries=0 --output=output/playwright/122/resume-local --reporter=list` (운영은 base URL과 output을 `https://zipath-web.vercel.app`, `resume-production`으로 변경).
- `/tmp/122-resume-{local,production,red,api}.log`는 이번 실행 로그다. 종료 코드가 확보되지 않은 실행은 PASS로 판정하지 않는다. 운영 SHA는 이번에도 미확인이고, 기존 BLOCKED 판정을 해제하지 않는다.
- P1 계약 GREEN, P2 운영 source SHA 및 실제 API 성공 수용 조건은 미완료다. 다음 실행은 하나의 독립된 빌드 서버만 사용해 남은 검증을 수행해야 한다. 배포 복구·workflow dispatch·secret 변경·Hold #155 재사용·형제 이슈 수정은 하지 않았다.

- 최종 중단 기록: 운영 전체 spec의 첫 desktop 대기 사례도 실패했다(12.4s). 나머지 E2E 및 API 전체 테스트는 실행 예산 내 종료 결과를 확보하지 못해 이번 worktree의 검증 프로세스만 SIGTERM으로 중지했다. 따라서 전체 test는 미통과/미확인으로 남긴다. 새 실패 artifact도 `output/playwright/122/resume-*`에 보존한다.


## 2026-11-13 18:08–18:14 KST 재검증

**Phase 1 완료 / Phase 2 BLOCKED: 운영 배포 SHA 확인/복구 필요.** 이전 기록을 보존한다.

### 소스 및 배포 관계

- 검증 소스 HEAD `a5c72a4`, 기능 기반/develop 조회 SHA `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`. 이번 변경은 복구 테스트·기록만 포함한다.
- 운영 URL `https://zipath-web.vercel.app/subscription`, HTTP 200. 브라우저 조회 시각 `2026-11-13T09:11:51.706Z`(18:11:51 KST).
- 응답 `x-vercel-id=icn1::59nmh-1794561111746-50690d862655`, `x-vercel-cache=HIT`, `age=15260413`. 요청 ID와 캐시 나이로 source SHA를 추정하지 않는다.
- GitHub 최신 Production deployment는 여전히 ID `4588149208`, SHA `e42afda31ec08f5969f9796315232ec92f1b9cd9`, 상태 `inactive`, URL `https://zipath-fp76nizas-sj48695s-projects.vercel.app`. 현재 alias의 deployment ID/source SHA는 확인되지 않았다. 이전에 실패한 Vercel token 조회는 반복하지 않았다.
- 현재 alias에서 청약통장 입력과 `참고용이며 법적 효력 없음` 고지가 없다. 로컬에서 확인된 구현과 운영 화면이 다르다. 운영 preflight 실패로 mock spec 8개를 반복하지 않았다.

### 실제 요청과 화면 증거

mock 없이 실제 요청을 한 번 보냈다. `POST https://zipath-api.onrender.com/api/subscription/simulate`, body는 age=31, income=4500, homelessMonths=24, dependents=2, isMarried=true, isFirstHome=false. 기존 운영 화면에는 savingsMonths 입력이 없다.

- 제출 직후와 10.5초 이후 모두 `확인 중...`만 보였다. 10초 지연 안내는 없다.
- 50,004ms 뒤에도 응답 status·결과·timeout 안내·재시도 버튼이 없었다. 입력 네 개와 혼인 체크 상태는 유지됐다. **실제 API 성공 및 실패 복구 미확인**이다.
- evidence.json의 `ERR_ABORTED`는 50초 관찰 후 모바일 초기 화면으로 이동할 때 발생한 취소다. 제품의 45초 timeout 증거로 사용하지 않는다.
- P0: 운영 주 흐름이 50초에도 완료되지 않음. P1: 지연 안내/45초 복구/필수 고지/청약통장 필드 부재. P2: 복구 UI까지 도달하지 못하여 운영 재시도 접근성 미검증. Skip: 새 스타일 변경.
- desktop 1280×900 `output/playwright/122/current-live/desktop-after50.png`, mobile 390×844 `output/playwright/122/current-live/mobile-initial.png`를 직접 열어 확인하고 보존했다. 원본 네트워크/텍스트/입력/응답 헤더는 같은 디렉터리 `evidence.json`에 보존한다. 기타 로컬 screenshot은 작업 디렉터리에 남기고 일괄 커밋하지 않았다.

### 로컬 검증 (운영 성공의 대체 증거 아님)

| 검증 | 결과 |
| --- | --- |
| 복구 spec, desktop/390px, workers=1, retries=0 | PASS 8/8, exit 0, 151.2초 |
| web targeted subscription-error/api | PASS 26 tests, exit 0 |
| 전체 web | PASS 11 suites / 51 tests, exit 0 |
| `npm test -w @zipath/api -- --runInBand` | PASS 20 suites / 217 tests, exit 0 |
| E2E/web/API `tsc --noEmit` | PASS, exit 0 |
| `npx turbo lint` | PASS 5 cached tasks, exit 0 |
| `npx turbo build` | PASS 3 cached tasks, exit 0 |
| `git diff --check` | PASS |

원본 명령/결과/attachment 목록과 임시 실행 config는 `output/playwright/122/current-verification/`에 보존했다. 초기 dev EMFILE 및 sandbox Chromium SIGABRT는 빌드 서버와 sandbox 밖 Chromium으로 해결했다. 실패한 준비 검사를 제품 GREEN으로 간주하지 않았다. 실제 45초를 단축하지 않았으며 desktop/mobile 모두 요청 취소·오류 제거·버튼 복구·동일 payload 재시도 성공을 확인했다.

운영 담당 후속 조건: #157 후속으로 현재 production alias의 deployment ID/URL/source SHA를 확보하고, 청약통장·필수 고지·page/error/api 구현이 포함된 배포를 확인해야 한다. 이후 운영 두 viewport 복구 계약과 mock 없는 API 성공을 다시 확인해야 Phase 2 및 #122 수용 조건을 완료할 수 있다. 이번 실행에서는 배포/secret/workflow 변경, push/PR 변경, Hold #155 재사용, 형제 이슈 변경, 작업트리/브랜치 정리를 하지 않았다.
