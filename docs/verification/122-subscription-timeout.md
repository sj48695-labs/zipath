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

로컬 artifact 경로(바이너리는 커밋하지 않음):

- `output/playwright/122/live/initial.png`: 운영 desktop 초기 화면. 직접 열어 청약통장·법적 고지 부재 확인.
- `output/playwright/122/live/after-submit.png`: 운영 실제 요청 60초 이후 상태.
- `output/playwright/122/production/`: 운영 실패 screenshot 및 error-context. desktop snapshot에 기존 단순 헤더·입력 4개·체크박스 2개만 관찰됨.
- `output/playwright/122/local/`: 로컬 테스트 실패 context 및 생성된 attachment.
- `/tmp/122-{local-e2e,production-e2e,api-test,web-test,lint,build,typecheck,live}.log`: 이번 실행 로그. 임시 로컬 증거이며 외부에 게시하지 않았다.

기존 구현을 바꾸거나 배포 복구를 수행하지 않는다. 후속 검토는 중단한 API 전체 테스트를 다시 실행하고, 로컬 서버 준비 후 6개 사례의 GREEN을 확보해야 한다. 운영 SHA 확인/복구 후 같은 spec과 mock 없는 실제 성공을 재검증해야 한다. `[P1]`/`[P2]` 커밋은 미완료 작업 체크포인트이며 운영 PASS를 뜻하지 않는다.

Skills used: code, ponytail(full), ui-design(match), playwright.
