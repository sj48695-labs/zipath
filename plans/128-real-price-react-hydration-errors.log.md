# #128 재개·검증 기록

이 파일은 실행 기록이다. 설계·phase·미완료 조건은 옆 plan을 따른다. `/plan`·`/code`의 기본 입력으로 전체 기록을 읽지 않고, 특정 실패 증적이 필요할 때 해당 절만 확인한다.

## 이전 plan에서 분리한 기록 (원문)

- 재사용: PR #154 / `128-react-hydration-7` / 현재 worktree. 조사 시작 HEAD와 원격 PR HEAD는 `97c100e2e174c7f4d64da2dcc01c7a915819fd93`로 일치한다.

- PR #147 merge SHA `0538ac971c5e716c6b7fe6c1dd72bcfbf780e305`, PR #150 merge SHA `5b9178f15167d61fa32adbf91e7b15493126b464`를 확인했다. 원격 develop `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`은 현재 HEAD의 조상이다. rebase 불필요.

- 이전 plan은 `547d1bc`에서 작성되고 `97c100e`에서 정리됐다. 과거 운영 SSR 계약 실패를 현재 회귀로 간주하지 않는다. 이번 계획은 최신 댓글의 검증 행렬을 반영해 같은 경로에 새로 기록한다.

- 배포 근거 주의: 조사 시 GitHub Production deployments 최신 레코드는 2026-05-05의 `e42afda31ec08f5969f9796315232ec92f1b9cd9`였다. 현재 alias의 SHA라는 증거는 없다. [배포 검증 run 35434014334](https://github.com/sj48695-labs/zipath/actions/runs/35434014334)는 `VERCEL_TOKEN` 누락으로 실패했다. 같은 workflow 재실행은 하지 않는다. `.github/workflows/production-web-regression.yml`은 SHA 불일치 시 운영 배포를 생성하므로 읽기 전용 확인 수단이 아니다.

- 회의록 `/tmp/pm-meeting-s8iAtT`는 존재하지 않는다. 제공된 PM 지침과 이슈의 최신 회의 댓글을 입력 자료로 사용했다.

- /plan 검증: 이슈 본문·전체 댓글, PR #154 및 #147/#150, #157, 현재 코드·기존 계약·CI·배포 기록 대조. `git diff --check` 수행. 제품 변경이 없어 빌드·단위 테스트·운영 브라우저 검증은 후속 phase로 남긴다.

- 자체 검토 1회: 최신 잔여 범위, 기존 수정 재사용, 파일 1개/관심사 1개, 정확한 경로·심볼·선례, 8개 시도, SHA 불확실성 및 실행 경계를 확인했다. 공통 추출 P0는 필요 없다.

## 2026-11-13 /plan 재검토

- 계획 작성 완료. 운영 검증 phase 완료를 뜻하지 않는다.
- 최신 입력: #128 본문·전체 댓글 및 11/13 댓글 https://github.com/sj48695-labs/zipath/issues/128#issuecomment-6845471837 . 기존 계획의 최신 출처는 11/11 댓글이었다.
- 변경점: 새 배포 파이프라인 금지 명시, 이번 감사에 React 오류가 없다는 사실과 과거 재현을 구분, favicon 별도 후보 유지. 범위의 본질은 운영 검증으로 동일하다.
- 기존 plan에 완료 phase 마커는 없다. 병합된 구현·계약 테스트와 커밋은 그대로 보존한다. 미완료 운영 검증을 배포 신원 확인(P1), 브라우저 검증(P2)으로 나눴다.
- 로컬 시작 HEAD: `5425c23` (기존 plan 커밋). PR #154 원격 head: `97c100e2e174c7f4d64da2dcc01c7a915819fd93`. PR OPEN / Draft, base develop. 원격과 로컬 HEAD가 같다는 과거 문구는 현재 사실이 아니다.
- #157 CLOSED (2026-10-02), PR #147 / #150 MERGED 확인. 원격 develop SHA `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`. rebase·worktree 전환 없이 현재 worktree에서 조사했다.
- PR 원격 head의 Lint / Build / Test SUCCESS, E2E(web) SKIPPED, Vercel SUCCESS. 로컬 계획 커밋과 현재 운영 alias에 대한 검증 근거로 전용하지 않는다.
- `/tmp/pm-meeting-ww5VhN` 없음. 사용자 PM 지침 및 최신 이슈 댓글을 사용했다.
- 형제 #158은 실거래가 timeout/상태 UI 검증, #122는 청약 API 대기/재시도 검증이다. #128에 재구현 범위를 추가하지 않는다.
- `.github/workflows/production-web-regression.yml` 확인: SHA 불일치 시 POST로 배포를 생성한다. 읽기 전용 검증 수단이 아니다. run 35434014334는 verify 실패·smoke skipped 상태이며 재실행하지 않았다.

### 기존 실패 증적 확인 (이번 운영 검증 결과 아님)

기존 staged 자료는 수정·삭제·새 계획 커밋에 포함하지 않고 유지했다. 실패를 성공으로 치환하지 않기 위해 다음 두 파일만 지정해서 읽었다.

- `output/playwright/128/matrix.log`: UTC 2026-11-10 20:12:05~22 (KST 11/11 05:12), Asia/Seoul. 두 경로 × 두 viewport × 직접 접근/새로고침 8회, 모두 HTTP 200. `/real-price`는 각 7건, `/real-price/compare`는 각 8건의 hydration pageerror. 서버 select는 pending이 아니고 202605부터, 마운트 후 값은 202611이었다. 가로 넘침 false. 배포 SHA 증거는 없다.
- `output/playwright/128/states.log`: 두 viewport에 loading/empty/error 기록, retryCount는 각각 0. 재시도 성공 증거가 아니다.
- `.playwright-cli/console-2026-11-10T20-10-12-296Z.log`의 오류 행에서도 #425/#418/#423 확인. 이 기록은 11/13 감사와 시점이 다르므로 현재 7건 재현으로 보고하지 않는다.
- 스크린샷은 `output/playwright/128/`에 보존돼 있다. 이번 /plan에서는 열어서 시각 합격 판정을 하지 않았다.

### 검토 및 범위

- 자체 검토 1회: 최신 댓글 반영, 병합 이력 보존, 단일 관심사/phase·파일 5개 이하, 정확한 심볼/선례, SHA 불확실성, 상태 UI와 형제 이슈 경계, 기록 분리를 확인했다.
- 사용 스킬: `plan`, `ui-design` match, `ponytail` full. UI 스킬은 AGENTS.md의 디자인 규칙에 따라 적용했다.
- 조사·계획 문서만 변경. 브라우저·빌드·단위 테스트·배포 실행은 하지 않았다. 문서 검증은 `git diff --check`로 수행한다.

## 2026-11-13 /code 재개: 기존 잔여 보존 [P2]

- soft-reset으로 복원된 staged 16개 파일을 삭제·재생성하지 않고 정식 체크포인트에 보존한다. `.playwright-cli/` 2개와 `output/playwright/128/` 14개는 11월 10일 자료이며 이번 운영 합격 증거가 아니다.
- 기존 matrix에는 React #425/#418/#423 및 서버 202605/클라이언트 202611 불일치가 있다. 기존 states에는 재시도 0회가 기록돼 있어 이번 검증으로 대체해야 한다.
- `git diff --cached --check`: exit 0. 본 커밋은 과거 자료 보존이며 Phase 2 완료 판정이 아니다.
- 제품 코드·설정·테스트·fixture·export 변경 없음. 현재 요구는 기존 계약 테스트 실행과 읽기 전용 검증이므로 새로운 RED/GREEN 구현은 추가하지 않는다.

## 2026-11-13 Phase 1: 읽기 전용 배포 확인 (미합격)

- 시각: 2026-11-13 14:46:23 UTC / 23:46:23 KST.
- PR #154 OPEN / Draft=true / head `97c100e2e174c7f4d64da2dcc01c7a915819fd93`. 로컬 시작 HEAD `9841ecd60161ed322cbb3b4be29c097ffd7cbda7`. #157 CLOSED.
- `vercel inspect https://zipath-web.vercel.app --no-color`: 인증 정보가 없어 로그인 대기 진입, 인증하지 않고 Ctrl-C (130). `VERCEL_TOKEN` 미설정, `.vercel/project.json` 없음, 연결된 Vercel 도구 없음.
- GitHub deployment 4588149208: 2026-05-05 / SHA `e42afda31ec08f5969f9796315232ec92f1b9cd9`, 최신 status inactive, URL `https://zipath-fp76nizas-sj48695s-projects.vercel.app`. 현재 alias 연결을 보여주지 않아 운영 SHA 증거로 채택하지 않는다.
- 기존 workflow run 43445855204 읽기 확인: verify failure / smoke skipped. 이 호출에서 workflow 실행·재실행·배포를 하지 않았다.
- 판정: alias → deployment → SHA 연결 및 #147/#150 수정 포함 여부 미확인. Phase 1 미완료 유지. 독립적인 Phase 2는 계속 진행.
- targeted 확인: gh PR/issue/deployment/run 조회 exit 0. Vercel 인증 제약은 제품 회귀가 아니다.

## 2026-11-13 Phase 2: 새 운영 브라우저 검증 (불합격)

- 대상: `https://zipath-web.vercel.app`, timezone Asia/Seoul. 아래 행별 UTC 시각에 +9h 하면 KST다. 11월 10일 증거와 별개로 이번에 새 수집했다.
- 첫 기본 계약 실행은 브라우저 실행 파일이 `/nonexistent/devloop-codex-sandbox-no-browser` 아래 없어 2건 모두 실행 전 실패(exit 1). CLI의 첫 sandbox 실행도 캐시 EPERM으로 실패. 설치된 Google Chrome을 사용한 승인된 실행으로 전환했다. 브라우저 다운로드/새 의존성 추가/저장소 설정 변경 없음.
- 기존 계약 테스트는 `/tmp/zipath128-pw.config.json`에 testDir 절대경로, baseURL 운영 URL, use.channel=chrome, chromium 프로젝트와 list reporter만 지정해 실행했다. 명령: `ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- real-price-hydration.spec.ts real-price-status.spec.ts --config=/tmp/zipath128-pw.config.json --project=chromium --workers=1`. exit 1, 5 failed. SSR pending 2건, loading status·error alert·empty 안내 3건 실패. RED를 확인했지만 SHA/배포 경계가 해소되지 않아 제품 GREEN 수정은 하지 않는다.
- CLI 8회 행렬은 경로×viewport별 새 context, 직접 접근 후 같은 URL 새로고침, 매 navigation 전 오류 배열 초기화. console error/warning 및 pageerror를 navigation 전에 수집했다. HTTP 모두 200, 서버 202605 선택/disabled 없음, 클라이언트 현재 202611/12개월 내림차순/활성화는 모두 정상이다.
- `/real-price`: 시도별 React #425 5회 + #418 1회 + #423 1회. `/real-price/compare`: 시도별 #425 6회 + #418 1회 + #423 1회. 관련 pageerror 총 60회. 일반 console warning은 0회. 첫 CLI navigation의 favicon 404는 아래 별도 원문에 보존하며 이 건수에서 제외한다.
- desktop/390px 캡처를 직접 확인: 헤더·월 선택·조회 버튼 잘림과 가로 넘침 없음. 월 선택에서 Tab 이동은 조회 버튼으로 진행(비교 화면도 아래 keyboard 원문 참조). 운영 법적 고지 `참고용이며 법적 효력 없음`은 두 화면에 없다. 로컬 SiteHeader에는 이미 정확한 고지가 있으므로 같은 코드를 중복 추가하지 않는다.
- mock 흐름: 두 viewport 모두 `조회 중...` → `해당 조건의 거래 데이터가 없습니다.` / HTTP 500 → `일시적인 오류` 및 내부 API 키 안내. `다시 시도` 버튼 0개로 재시도→empty는 실행 불가. 공공 API 성공·전체 timeout 회귀의 증거가 아니다(#158 범위).
- 대표 실패 스크린샷: `output/playwright/128/current-1440.png`, `output/playwright/128/current-390.png`.
- P1 Blocking: 운영 hydration 계약 실패, 필수 고지 부재, 오류 복구 행동 부재. 배포 SHA 미확인으로 원인을 최신 소스 회귀로 확정하지 않는다. P2 Improving: 운영 오류가 API 키 설정 같은 구현 용어를 표시한다. Skip: favicon은 #85 별도 후보, 새 이슈·댓글 생성 없음.
- Phase 2 미완료. 배포 변경·workflow 실행·push·Ready·merge·cleanup 없이 후속 파이프라인에 실제 실패 상태를 전달한다.

### 8회 행렬 원문

```json
{"path": "/real-price", "width": 1440, "action": "direct", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:41.125Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "BUTTON", "text": "조회"}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price", "width": 1440, "action": "reload", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:41.630Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "BUTTON", "text": "조회"}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price", "width": 390, "action": "direct", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:42.327Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "BUTTON", "text": "조회"}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price", "width": 390, "action": "reload", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:42.766Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "BUTTON", "text": "조회"}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price/compare", "width": 1440, "action": "direct", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:44.086Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "BODY", "text": "(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([2,null])self.__next_f.push([1,\"1:HL[\\\"/_next/static/css/5882d2b59ec0e367.css\\\",\\\"style\\\"]\\n\"])self.__next_f.push([1,\"2:I[1815,[],\\\"\\\"]\\n4:I[5428,[],\\\"ClientPageRoot\\\"]\\n5:I[1893,[\\\"340\\\",\\\"static/chunks/340-b8dfd87f0860d8a2.js\\\",\\\"660\\\",\\\"static/chunks/660-e90b166f259260cb.js\\\",\\\"721\\\",\\\"static/chunks/app/real-price/compare/page-b15d2fc3db82e111.js\\\"],\\\"default\\\",1]\\n6:I[5092,[],\\\"\\\"]\\n7:I[2023,[],\\\"\\\"]\\n8:I[9799,[\\\"185\\\",\\\"static/chunks/app/layout-699522f47b50d88d.js\\\"],\\\"Providers\\\"]\\na:I[1584,[],\\\"\\\"]\\nb:[]\\n\"])self.__next_f.push([1,\"0:[\\\"$\\\",\\\"$L2\\\",null,{\\\"buildId\\\":\\\"kPQIQYOTYWS6nHtjSlbPi\\\",\\\"assetPrefix\\\":\\\"\\\",\\\"urlParts\\\":[\\\"\\\",\\\"real-price\\\",\\\"compare\\\"],\\\"initialTree\\\":[\\\"\\\",{\\\"children\\\":[\\\"real-price\\\",{\\\"children\\\":[\\\"compare\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{}]}]}]},\\\"$undefined\\\",\\\"$undefined\\\",true],\\\"initialSeedData\\\":[\\\"\\\",{\\\"children\\\":[\\\"real-price\\\",{\\\"children\\\":[\\\"compare\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{},[[\\\"$L3\\\",[\\\"$\\\",\\\"$L4\\\",null,{\\\"props\\\":{\\\"params\\\":{},\\\"searchParams\\\":{}},\\\"Component\\\":\\\"$5\\\"}],null],null],null]},[null,[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\",\\\"real-price\\\",\\\"children\\\",\\\"compare\\\",\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"notFoundStyles\\\":\\\"$undefined\\\"}]],null]},[null,[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\",\\\"real-price\\\",\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"notFoundStyles\\\":\\\"$undefined\\\"}]],null]},[[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/css/5882d2b59ec0e367.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"ko\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"className\\\":\\\"min-h-screen antialiased\\\",\\\"children\\\":[\\\"$\\\",\\\"$L8\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontFamily\\\":\\\"system-ui,\\\\\\\"Segoe UI\\\\\\\",Roboto,Helvetica,Arial,sans-serif,\\\\\\\"Apple Color Emoji\\\\\\\",\\\\\\\"Segoe UI Emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textAlign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexDirection\\\":\\\"column\\\",\\\"alignItems\\\":\\\"center\\\",\\\"justifyContent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontSize\\\":24,\\\"fontWeight\\\":500,\\\"verticalAlign\\\":\\\"top\\\",\\\"lineHeight\\\":\\\"49px\\\"},\\\"children\\\":\\\"404\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontSize\\\":14,\\\"fontWeight\\\":400,\\\"lineHeight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]],\\\"notFoundStyles\\\":[]}]}]}]}]],null],null],\\\"couldBeIntercepted\\\":false,\\\"initialHead\\\":[null,\\\"$L9\\\"],\\\"globalErrorComponent\\\":\\\"$a\\\",\\\"missingSlots\\\":\\\"$Wb\\\"}]\\n\"])self.__next_f.push([1,\"9:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"charSet\\\":\\\"utf-8\\\"}],[\\\"$\\\",\\\"title\\\",\\\"2\\\",{\\\"children\\\":\\\"Zipath - 내 집으로 가는 길\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"3\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"부동산 입문자를 위한 올인원 가이드\\\"}]]\\n3:null\\n\"])Zipath청약실거래가대출체크리스트← 실거래가 조회지역 간 비교2~4개 지역의 아파트 실거래가를 비교합니다.지역 선택 (0/4)서울 종로구서울 중구서울 용산구서울 성동구서울 광진구서울 동대문구서울 중랑구서울 성북구서울 강북구서울 도봉구서울 노원구서울 은평구서울 서대문구서울 마포구서울 양천구서울 강서구서울 구로구서울 금천구서울 영등포구서울 동작구서울 관악구서울 서초구서울 강남구서울 송파구서울 강동구경기 수원시 장안구경기 수원시 권선구경기 수원시 팔달구경기 수원시 영통구경기 성남시 수정구경기 성남시 중원구경기 성남시 분당구경기 고양시 덕양구경기 고양시 일산동구경기 고양시 일산서구경기 화성시경기 파주시경기 용인시 처인구경기 용인시 기흥구경기 용인시 수지구경기 김포시인천 중구인천 동구인천 미추홀구인천 연수구인천 남동구인천 부평구인천 계양구인천 서구부산 중구부산 서구부산 동구부산 영도구부산 부산진구부산 동래구부산 남구부산 북구부산 해운대구부산 사하구부산 금정구부산 강서구부산 연제구부산 수영구부산 사상구부산 기장군계약월2026년 11월2026년 10월2026년 9월2026년 8월2026년 7월2026년 6월2026년 5월2026년 4월2026년 3월2026년 2월2026년 1월2025년 12월비교 조회최소 2개 지역을 선택해주세요.비교할 지역을 선택한 후 \"비교 조회\" 버튼을 눌러주세요."}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price/compare", "width": 1440, "action": "reload", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:44.474Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "A", "text": "Zipath"}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price/compare", "width": 390, "action": "direct", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:45.087Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "BODY", "text": "(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([2,null])self.__next_f.push([1,\"1:HL[\\\"/_next/static/css/5882d2b59ec0e367.css\\\",\\\"style\\\"]\\n\"])self.__next_f.push([1,\"2:I[1815,[],\\\"\\\"]\\n4:I[5428,[],\\\"ClientPageRoot\\\"]\\n5:I[1893,[\\\"340\\\",\\\"static/chunks/340-b8dfd87f0860d8a2.js\\\",\\\"660\\\",\\\"static/chunks/660-e90b166f259260cb.js\\\",\\\"721\\\",\\\"static/chunks/app/real-price/compare/page-b15d2fc3db82e111.js\\\"],\\\"default\\\",1]\\n6:I[5092,[],\\\"\\\"]\\n7:I[2023,[],\\\"\\\"]\\n8:I[9799,[\\\"185\\\",\\\"static/chunks/app/layout-699522f47b50d88d.js\\\"],\\\"Providers\\\"]\\na:I[1584,[],\\\"\\\"]\\nb:[]\\n\"])self.__next_f.push([1,\"0:[\\\"$\\\",\\\"$L2\\\",null,{\\\"buildId\\\":\\\"kPQIQYOTYWS6nHtjSlbPi\\\",\\\"assetPrefix\\\":\\\"\\\",\\\"urlParts\\\":[\\\"\\\",\\\"real-price\\\",\\\"compare\\\"],\\\"initialTree\\\":[\\\"\\\",{\\\"children\\\":[\\\"real-price\\\",{\\\"children\\\":[\\\"compare\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{}]}]}]},\\\"$undefined\\\",\\\"$undefined\\\",true],\\\"initialSeedData\\\":[\\\"\\\",{\\\"children\\\":[\\\"real-price\\\",{\\\"children\\\":[\\\"compare\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{},[[\\\"$L3\\\",[\\\"$\\\",\\\"$L4\\\",null,{\\\"props\\\":{\\\"params\\\":{},\\\"searchParams\\\":{}},\\\"Component\\\":\\\"$5\\\"}],null],null],null]},[null,[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\",\\\"real-price\\\",\\\"children\\\",\\\"compare\\\",\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"notFoundStyles\\\":\\\"$undefined\\\"}]],null]},[null,[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\",\\\"real-price\\\",\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"notFoundStyles\\\":\\\"$undefined\\\"}]],null]},[[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/css/5882d2b59ec0e367.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"ko\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"className\\\":\\\"min-h-screen antialiased\\\",\\\"children\\\":[\\\"$\\\",\\\"$L8\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"segmentPath\\\":[\\\"children\\\"],\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontFamily\\\":\\\"system-ui,\\\\\\\"Segoe UI\\\\\\\",Roboto,Helvetica,Arial,sans-serif,\\\\\\\"Apple Color Emoji\\\\\\\",\\\\\\\"Segoe UI Emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textAlign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexDirection\\\":\\\"column\\\",\\\"alignItems\\\":\\\"center\\\",\\\"justifyContent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontSize\\\":24,\\\"fontWeight\\\":500,\\\"verticalAlign\\\":\\\"top\\\",\\\"lineHeight\\\":\\\"49px\\\"},\\\"children\\\":\\\"404\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontSize\\\":14,\\\"fontWeight\\\":400,\\\"lineHeight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]],\\\"notFoundStyles\\\":[]}]}]}]}]],null],null],\\\"couldBeIntercepted\\\":false,\\\"initialHead\\\":[null,\\\"$L9\\\"],\\\"globalErrorComponent\\\":\\\"$a\\\",\\\"missingSlots\\\":\\\"$Wb\\\"}]\\n\"])self.__next_f.push([1,\"9:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"charSet\\\":\\\"utf-8\\\"}],[\\\"$\\\",\\\"title\\\",\\\"2\\\",{\\\"children\\\":\\\"Zipath - 내 집으로 가는 길\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"3\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"부동산 입문자를 위한 올인원 가이드\\\"}]]\\n3:null\\n\"])Zipath청약실거래가대출체크리스트← 실거래가 조회지역 간 비교2~4개 지역의 아파트 실거래가를 비교합니다.지역 선택 (0/4)서울 종로구서울 중구서울 용산구서울 성동구서울 광진구서울 동대문구서울 중랑구서울 성북구서울 강북구서울 도봉구서울 노원구서울 은평구서울 서대문구서울 마포구서울 양천구서울 강서구서울 구로구서울 금천구서울 영등포구서울 동작구서울 관악구서울 서초구서울 강남구서울 송파구서울 강동구경기 수원시 장안구경기 수원시 권선구경기 수원시 팔달구경기 수원시 영통구경기 성남시 수정구경기 성남시 중원구경기 성남시 분당구경기 고양시 덕양구경기 고양시 일산동구경기 고양시 일산서구경기 화성시경기 파주시경기 용인시 처인구경기 용인시 기흥구경기 용인시 수지구경기 김포시인천 중구인천 동구인천 미추홀구인천 연수구인천 남동구인천 부평구인천 계양구인천 서구부산 중구부산 서구부산 동구부산 영도구부산 부산진구부산 동래구부산 남구부산 북구부산 해운대구부산 사하구부산 금정구부산 강서구부산 연제구부산 수영구부산 사상구부산 기장군계약월2026년 11월2026년 10월2026년 9월2026년 8월2026년 7월2026년 6월2026년 5월2026년 4월2026년 3월2026년 2월2026년 1월2025년 12월비교 조회최소 2개 지역을 선택해주세요.비교할 지역을 선택한 후 \"비교 조회\" 버튼을 눌러주세요."}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

```json
{"path": "/real-price/compare", "width": 390, "action": "reload", "status": 200, "serverSelect": "계약월</label><select class=\"w-full rounded-lg border bg-background px-3 py-2 text-sm\"><option value=\"202605\" selected=\"\">2026년 5월</option><option value=\"202604\">2026년 4월</option><option value=\"202603\">2026년 3월</option><option value=\"202602\">2026년 2월</option><option value=\"202601\">2026년 1월</option><option value=\"202512\">2025년 12월</option><option value=\"202511\">2025년 11월</option><option value=\"202510\">2025년 10월</option><option value=\"202509\">2025년 9월</option><option value=\"202508\">2025년 8월</option><option value=\"202507\">2025년 7월</option><option value=\"202506\">2025년 6월</option></select>", "pending": false, "state": {"time": "2026-11-13T14:47:45.495Z", "zone": "Asia/Seoul", "month": "202611", "value": "202611", "disabled": false, "options": [{"value": "202611", "label": "2026년 11월"}, {"value": "202610", "label": "2026년 10월"}, {"value": "202609", "label": "2026년 9월"}, {"value": "202608", "label": "2026년 8월"}, {"value": "202607", "label": "2026년 7월"}, {"value": "202606", "label": "2026년 6월"}, {"value": "202605", "label": "2026년 5월"}, {"value": "202604", "label": "2026년 4월"}, {"value": "202603", "label": "2026년 3월"}, {"value": "202602", "label": "2026년 2월"}, {"value": "202601", "label": "2026년 1월"}, {"value": "202512", "label": "2025년 12월"}], "expected": ["202611", "202610", "202609", "202608", "202607", "202606", "202605", "202604", "202603", "202602", "202601", "202512"], "overflow": false, "disclaimer": false, "header": true}, "keyboard": {"tag": "A", "text": "Zipath"}, "events": [{"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}, {"type": "pageerror", "text": "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}], "pass": false}
```

### mock 상태 원문

```json
[
  {
    "time": "2026-11-13T14:48:24.455Z",
    "width": 1440,
    "mock": true,
    "loading": "실거래가 조회\n지역 간 비교 →\n\n국토교통부 아파트 매매 실거래가 데이터를 조회합니다.\n\n테이블\n차트\n월별 추이\n지역\n서울 종로구\n서울 중구\n서울 용산구\n서울 성동구\n서울 광진구\n서울 동대문구\n서울 중랑구\n서울 성북구\n서울 강북구\n서울 도봉구\n서울 노원구\n서울 은평구\n서울 서대문구\n서울 마포구\n서울 양천구\n서울 강서구\n서울 구로구\n서울 금천구\n서울 영등포구\n서울 동작구\n서울 관악구\n서울 서초구\n서울 강남구\n서울 송파구\n서울 강동구\n경기 수원시 장안구\n경기 수원시 권선구\n경기 수원시 팔달구\n경기 수원시 영통구\n경기 성남시 수정구\n경기 성남시 중원구\n경기 성남시 분당구\n경기 고양시 덕양구\n경기 고양시 일산동구\n경기 고양시 일산서구\n경기 화성시\n경기 파주시\n경기 용인시 처인구\n경기 용인시 기흥구\n경기 용인시 수지구\n경기 김포시\n인천 중구\n인천 동구\n인천 미추홀구\n인천 연수구\n인천 남동구\n인천 부평구\n인천 계양구\n인천 서구\n부산 중구\n부산 서구\n부산 동구\n부산 영도구\n부산 부산진구\n부산 동래구\n부산 남구\n부산 북구\n부산 해운대구\n부산 사하구\n부산 금정구\n부산 강서구\n부산 연제구\n부산 수영구\n부산 사상구\n부산 기장군\n계약월\n2026년 11월\n2026년 10월\n2026년 9월\n2026년 8월\n2026년 7월\n2026년 6월\n2026년 5월\n2026년 4월\n2026년 3월\n2026년 2월\n2026년 1월\n2025년 12월\n조회 중...\n평형별 필터\n전체\n~60㎡ (소형)\n60~85㎡ (중형)\n85~135㎡ (대형)\n135㎡~ (초대형)\n직접 입력",
    "empty": "실거래가 조회\n지역 간 비교 →\n\n국토교통부 아파트 매매 실거래가 데이터를 조회합니다.\n\n테이블\n차트\n월별 추이\n지역\n서울 종로구\n서울 중구\n서울 용산구\n서울 성동구\n서울 광진구\n서울 동대문구\n서울 중랑구\n서울 성북구\n서울 강북구\n서울 도봉구\n서울 노원구\n서울 은평구\n서울 서대문구\n서울 마포구\n서울 양천구\n서울 강서구\n서울 구로구\n서울 금천구\n서울 영등포구\n서울 동작구\n서울 관악구\n서울 서초구\n서울 강남구\n서울 송파구\n서울 강동구\n경기 수원시 장안구\n경기 수원시 권선구\n경기 수원시 팔달구\n경기 수원시 영통구\n경기 성남시 수정구\n경기 성남시 중원구\n경기 성남시 분당구\n경기 고양시 덕양구\n경기 고양시 일산동구\n경기 고양시 일산서구\n경기 화성시\n경기 파주시\n경기 용인시 처인구\n경기 용인시 기흥구\n경기 용인시 수지구\n경기 김포시\n인천 중구\n인천 동구\n인천 미추홀구\n인천 연수구\n인천 남동구\n인천 부평구\n인천 계양구\n인천 서구\n부산 중구\n부산 서구\n부산 동구\n부산 영도구\n부산 부산진구\n부산 동래구\n부산 남구\n부산 북구\n부산 해운대구\n부산 사하구\n부산 금정구\n부산 강서구\n부산 연제구\n부산 수영구\n부산 사상구\n부산 기장군\n계약월\n2026년 11월\n2026년 10월\n2026년 9월\n2026년 8월\n2026년 7월\n2026년 6월\n2026년 5월\n2026년 4월\n2026년 3월\n2026년 2월\n2026년 1월\n2025년 12월\n조회\n평형별 필터\n전체\n~60㎡ (소형)\n60~85㎡ (중형)\n85~135㎡ (대형)\n135㎡~ (초대형)\n직접 입력\n해당 조건의 거래 데이터가 없습니다.",
    "error": "실거래가 조회\n지역 간 비교 →\n\n국토교통부 아파트 매매 실거래가 데이터를 조회합니다.\n\n테이블\n차트\n월별 추이\n지역\n서울 종로구\n서울 중구\n서울 용산구\n서울 성동구\n서울 광진구\n서울 동대문구\n서울 중랑구\n서울 성북구\n서울 강북구\n서울 도봉구\n서울 노원구\n서울 은평구\n서울 서대문구\n서울 마포구\n서울 양천구\n서울 강서구\n서울 구로구\n서울 금천구\n서울 영등포구\n서울 동작구\n서울 관악구\n서울 서초구\n서울 강남구\n서울 송파구\n서울 강동구\n경기 수원시 장안구\n경기 수원시 권선구\n경기 수원시 팔달구\n경기 수원시 영통구\n경기 성남시 수정구\n경기 성남시 중원구\n경기 성남시 분당구\n경기 고양시 덕양구\n경기 고양시 일산동구\n경기 고양시 일산서구\n경기 화성시\n경기 파주시\n경기 용인시 처인구\n경기 용인시 기흥구\n경기 용인시 수지구\n경기 김포시\n인천 중구\n인천 동구\n인천 미추홀구\n인천 연수구\n인천 남동구\n인천 부평구\n인천 계양구\n인천 서구\n부산 중구\n부산 서구\n부산 동구\n부산 영도구\n부산 부산진구\n부산 동래구\n부산 남구\n부산 북구\n부산 해운대구\n부산 사하구\n부산 금정구\n부산 강서구\n부산 연제구\n부산 수영구\n부산 사상구\n부산 기장군\n계약월\n2026년 11월\n2026년 10월\n2026년 9월\n2026년 8월\n2026년 7월\n2026년 6월\n2026년 5월\n2026년 4월\n2026년 3월\n2026년 2월\n2026년 1월\n2025년 12월\n조회\n평형별 필터\n전체\n~60㎡ (소형)\n60~85㎡ (중형)\n85~135㎡ (대형)\n135㎡~ (초대형)\n직접 입력\n\n일시적인 오류\n\ndata.go.kr API 키가 설정되어 있는지 확인해주세요.",
    "retryCount": 0,
    "recovered": false
  },
  {
    "time": "2026-11-13T14:48:24.997Z",
    "width": 390,
    "mock": true,
    "loading": "실거래가 조회\n지역 간 비교 →\n\n국토교통부 아파트 매매 실거래가 데이터를 조회합니다.\n\n테이블\n차트\n월별 추이\n지역\n서울 종로구\n서울 중구\n서울 용산구\n서울 성동구\n서울 광진구\n서울 동대문구\n서울 중랑구\n서울 성북구\n서울 강북구\n서울 도봉구\n서울 노원구\n서울 은평구\n서울 서대문구\n서울 마포구\n서울 양천구\n서울 강서구\n서울 구로구\n서울 금천구\n서울 영등포구\n서울 동작구\n서울 관악구\n서울 서초구\n서울 강남구\n서울 송파구\n서울 강동구\n경기 수원시 장안구\n경기 수원시 권선구\n경기 수원시 팔달구\n경기 수원시 영통구\n경기 성남시 수정구\n경기 성남시 중원구\n경기 성남시 분당구\n경기 고양시 덕양구\n경기 고양시 일산동구\n경기 고양시 일산서구\n경기 화성시\n경기 파주시\n경기 용인시 처인구\n경기 용인시 기흥구\n경기 용인시 수지구\n경기 김포시\n인천 중구\n인천 동구\n인천 미추홀구\n인천 연수구\n인천 남동구\n인천 부평구\n인천 계양구\n인천 서구\n부산 중구\n부산 서구\n부산 동구\n부산 영도구\n부산 부산진구\n부산 동래구\n부산 남구\n부산 북구\n부산 해운대구\n부산 사하구\n부산 금정구\n부산 강서구\n부산 연제구\n부산 수영구\n부산 사상구\n부산 기장군\n계약월\n2026년 11월\n2026년 10월\n2026년 9월\n2026년 8월\n2026년 7월\n2026년 6월\n2026년 5월\n2026년 4월\n2026년 3월\n2026년 2월\n2026년 1월\n2025년 12월\n조회 중...\n평형별 필터\n전체\n~60㎡ (소형)\n60~85㎡ (중형)\n85~135㎡ (대형)\n135㎡~ (초대형)\n직접 입력",
    "empty": "실거래가 조회\n지역 간 비교 →\n\n국토교통부 아파트 매매 실거래가 데이터를 조회합니다.\n\n테이블\n차트\n월별 추이\n지역\n서울 종로구\n서울 중구\n서울 용산구\n서울 성동구\n서울 광진구\n서울 동대문구\n서울 중랑구\n서울 성북구\n서울 강북구\n서울 도봉구\n서울 노원구\n서울 은평구\n서울 서대문구\n서울 마포구\n서울 양천구\n서울 강서구\n서울 구로구\n서울 금천구\n서울 영등포구\n서울 동작구\n서울 관악구\n서울 서초구\n서울 강남구\n서울 송파구\n서울 강동구\n경기 수원시 장안구\n경기 수원시 권선구\n경기 수원시 팔달구\n경기 수원시 영통구\n경기 성남시 수정구\n경기 성남시 중원구\n경기 성남시 분당구\n경기 고양시 덕양구\n경기 고양시 일산동구\n경기 고양시 일산서구\n경기 화성시\n경기 파주시\n경기 용인시 처인구\n경기 용인시 기흥구\n경기 용인시 수지구\n경기 김포시\n인천 중구\n인천 동구\n인천 미추홀구\n인천 연수구\n인천 남동구\n인천 부평구\n인천 계양구\n인천 서구\n부산 중구\n부산 서구\n부산 동구\n부산 영도구\n부산 부산진구\n부산 동래구\n부산 남구\n부산 북구\n부산 해운대구\n부산 사하구\n부산 금정구\n부산 강서구\n부산 연제구\n부산 수영구\n부산 사상구\n부산 기장군\n계약월\n2026년 11월\n2026년 10월\n2026년 9월\n2026년 8월\n2026년 7월\n2026년 6월\n2026년 5월\n2026년 4월\n2026년 3월\n2026년 2월\n2026년 1월\n2025년 12월\n조회\n평형별 필터\n전체\n~60㎡ (소형)\n60~85㎡ (중형)\n85~135㎡ (대형)\n135㎡~ (초대형)\n직접 입력\n해당 조건의 거래 데이터가 없습니다.",
    "error": "실거래가 조회\n지역 간 비교 →\n\n국토교통부 아파트 매매 실거래가 데이터를 조회합니다.\n\n테이블\n차트\n월별 추이\n지역\n서울 종로구\n서울 중구\n서울 용산구\n서울 성동구\n서울 광진구\n서울 동대문구\n서울 중랑구\n서울 성북구\n서울 강북구\n서울 도봉구\n서울 노원구\n서울 은평구\n서울 서대문구\n서울 마포구\n서울 양천구\n서울 강서구\n서울 구로구\n서울 금천구\n서울 영등포구\n서울 동작구\n서울 관악구\n서울 서초구\n서울 강남구\n서울 송파구\n서울 강동구\n경기 수원시 장안구\n경기 수원시 권선구\n경기 수원시 팔달구\n경기 수원시 영통구\n경기 성남시 수정구\n경기 성남시 중원구\n경기 성남시 분당구\n경기 고양시 덕양구\n경기 고양시 일산동구\n경기 고양시 일산서구\n경기 화성시\n경기 파주시\n경기 용인시 처인구\n경기 용인시 기흥구\n경기 용인시 수지구\n경기 김포시\n인천 중구\n인천 동구\n인천 미추홀구\n인천 연수구\n인천 남동구\n인천 부평구\n인천 계양구\n인천 서구\n부산 중구\n부산 서구\n부산 동구\n부산 영도구\n부산 부산진구\n부산 동래구\n부산 남구\n부산 북구\n부산 해운대구\n부산 사하구\n부산 금정구\n부산 강서구\n부산 연제구\n부산 수영구\n부산 사상구\n부산 기장군\n계약월\n2026년 11월\n2026년 10월\n2026년 9월\n2026년 8월\n2026년 7월\n2026년 6월\n2026년 5월\n2026년 4월\n2026년 3월\n2026년 2월\n2026년 1월\n2025년 12월\n조회\n평형별 필터\n전체\n~60㎡ (소형)\n60~85㎡ (중형)\n85~135㎡ (대형)\n135㎡~ (초대형)\n직접 입력\n\n일시적인 오류\n\ndata.go.kr API 키가 설정되어 있는지 확인해주세요.",
    "retryCount": 0,
    "recovered": false
  }
]
```

### 재현한 CLI 수집 코드

`npx --no-install playwright-cli -s=issue128 run-code <아래 함수>` 실행은 exit 0 (수집 성공이며 계약 합격을 의미하지 않음).

```js
async (page) => {
 const browser=page.context().browser(); const rows=[];
 for (const path of ['/real-price','/real-price/compare']) for (const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},timezoneId:'Asia/Seoul'});
  const p=await context.newPage(); let events=[];
  p.on('console',m=>{if(['error','warning'].includes(m.type())) events.push({type:m.type(),text:m.text()})});
  p.on('pageerror',e=>events.push({type:'pageerror',text:e.message}));
  for (const action of ['direct','reload']) {
   events=[];
   const response=action==='direct'?await p.goto('https://zipath-web.vercel.app'+path):await p.reload();
   const html=await response.text();
   await p.locator('label',{hasText:'계약월'}).locator('xpath=following-sibling::select').waitFor();
   await p.waitForFunction(()=>{const s=[...document.querySelectorAll('select')].at(-1);return s && /^\d{6}$/.test(s.value)});
   await p.waitForTimeout(300);
   const state=await p.evaluate(()=>{
    const label=[...document.querySelectorAll('label')].find(e=>e.textContent.includes('계약월')); const s=label.nextElementSibling;
    const now=new Date();const month=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
    const expected=Array.from({length:12},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1);return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`});
    return {time:now.toISOString(),zone:Intl.DateTimeFormat().resolvedOptions().timeZone,month,value:s.value,disabled:s.disabled,options:[...s.options].map(o=>({value:o.value,label:o.text})),expected,overflow:document.documentElement.scrollWidth>innerWidth,disclaimer:document.body.innerText.includes('참고용이며 법적 효력 없음'),header:!!document.querySelector('header')};
   });
   const serverSelect=html.match(/계약월[\s\S]*?<select[^>]*>[\s\S]*?<\/select>/)?.[0];
   const pending=!!serverSelect && /disabled/.test(serverSelect) && /value=""/.test(serverSelect) && serverSelect.includes('불러오는 중...') && !/value="\d{6}"/.test(serverSelect);
   const select=p.locator('label',{hasText:'계약월'}).locator('xpath=following-sibling::select');await select.focus();await p.keyboard.press('Tab');
   const keyboard=await p.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent}));
   rows.push({path,width,action,status:response.status(),serverSelect,pending,state,keyboard,events:[...events],pass:pending&&state.value===state.month&&!state.disabled&&JSON.stringify(state.options.map(o=>o.value))===JSON.stringify(state.expected)&&!events.some(e=>/hydration|Minified React error|Text content does not match/i.test(e.text))});
   if(path==='/real-price'&&action==='direct') await p.screenshot({path:`output/playwright/128/current-${width}.png`,fullPage:true});
  }
  await context.close();
 }
 return JSON.stringify(rows);
}
```

```js
async (page) => {
 const results=[];
 for(const width of [1440,390]) {
  const context=await page.context().browser().newContext({viewport:{width,height:width===390?844:900},timezoneId:'Asia/Seoul'});const p=await context.newPage();let fail=false;let release;
  await p.route('**/api/real-price?*',async route=>{if(release)await release;await route.fulfill({status:fail?500:200,contentType:'application/json',body:JSON.stringify(fail?{error:'일시적인 오류'}:{trades:[]})})});
  await p.goto('https://zipath-web.vercel.app/real-price');const month=p.locator('label',{hasText:'계약월'}).locator('xpath=following-sibling::select');await month.waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('select')].some(s=>s.value==='202611'));
  let done;release=new Promise(r=>done=r);await p.getByRole('button',{name:'조회',exact:true}).click();
  const loading=await p.locator('main').innerText();done();release=undefined;await p.getByRole('button',{name:'조회',exact:true}).waitFor();const empty=await p.locator('main').innerText();
  fail=true;await p.getByRole('button',{name:'조회',exact:true}).click();await p.getByRole('button',{name:'조회',exact:true}).waitFor();const error=await p.locator('main').innerText();const retry=p.getByRole('button',{name:'다시 시도'});let retryCount=await retry.count();let recovered=false;
  if(retryCount){fail=false;await retry.click();await p.getByRole('button',{name:'조회',exact:true}).waitFor();recovered=(await p.locator('main').innerText()).includes('검색 결과가 없습니다')}
  results.push({time:new Date().toISOString(),width,mock:true,loading,empty,error,retryCount,recovered});await context.close();
 }
 return JSON.stringify(results);
}
```

### 첫 CLI 탐색 콘솔·스냅샷 원문

.playwright-cli/console-2026-11-13T14-46-41-373Z.log

```text
[     259ms] Error: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at sq (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:146764)
    at co (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:158778)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:99415
    at iu (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:103866)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95222)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91087
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91094
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91199)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     262ms] Error: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at sq (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:146764)
    at co (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:158778)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:99415
    at iu (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:103866)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95222)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91087
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91094
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91199)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     262ms] Error: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at sq (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:146764)
    at co (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:158778)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:99415
    at iu (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:103866)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95222)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91087
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91094
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91199)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     262ms] Error: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at sq (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:146764)
    at co (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:158778)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:99415
    at iu (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:103866)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95222)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91087
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91094
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91199)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     263ms] Error: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at sq (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:146764)
    at co (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:158778)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:99415
    at iu (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:103866)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95222)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91087
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91094
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91199)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     263ms] Error: Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at t5 (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:24669)
    at iZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:120534)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95161)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91087
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91094
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91199)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     264ms] Error: Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at iZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:118348)
    at ia (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:95161)
    at https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:94983
    at il (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:94990)
    at oJ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:92346)
    at oZ (https://zipath-web.vercel.app/_next/static/chunks/1dd3208c-5b0300d67d8b57bc.js:1:91765)
    at MessagePort.M (https://zipath-web.vercel.app/_next/static/chunks/528-17d2f941dd6582ca.js:1:84738)
[     278ms] [ERROR] Failed to load resource: the server responded with a status of 404 () @ https://zipath-web.vercel.app/favicon.ico:0

```

.playwright-cli/page-2026-11-13T14-46-41-708Z.yml

```text
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "Zipath" [ref=e5] [cursor=pointer]:
          - /url: /
        - navigation [ref=e6]:
          - link "청약" [ref=e7] [cursor=pointer]:
            - /url: /subscription
          - link "대출" [ref=e8] [cursor=pointer]:
            - /url: /loan
          - link "체크리스트" [ref=e9] [cursor=pointer]:
            - /url: /checklist
    - main [ref=e10]:
      - generic [ref=e11]:
        - heading "실거래가 조회" [level=1] [ref=e12]
        - link "지역 간 비교 →" [ref=e13] [cursor=pointer]:
          - /url: /real-price/compare
      - paragraph [ref=e14]: 국토교통부 아파트 매매 실거래가 데이터를 조회합니다.
      - generic [ref=e15]:
        - button "테이블" [ref=e16] [cursor=pointer]
        - button "차트" [ref=e17] [cursor=pointer]
        - button "월별 추이" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: 지역
          - combobox [ref=e22]:
            - option "서울 종로구"
            - option "서울 중구"
            - option "서울 용산구"
            - option "서울 성동구"
            - option "서울 광진구"
            - option "서울 동대문구"
            - option "서울 중랑구"
            - option "서울 성북구"
            - option "서울 강북구"
            - option "서울 도봉구"
            - option "서울 노원구"
            - option "서울 은평구"
            - option "서울 서대문구"
            - option "서울 마포구"
            - option "서울 양천구"
            - option "서울 강서구"
            - option "서울 구로구"
            - option "서울 금천구"
            - option "서울 영등포구"
            - option "서울 동작구"
            - option "서울 관악구"
            - option "서울 서초구"
            - option "서울 강남구" [selected]
            - option "서울 송파구"
            - option "서울 강동구"
            - option "경기 수원시 장안구"
            - option "경기 수원시 권선구"
            - option "경기 수원시 팔달구"
            - option "경기 수원시 영통구"
            - option "경기 성남시 수정구"
            - option "경기 성남시 중원구"
            - option "경기 성남시 분당구"
            - option "경기 고양시 덕양구"
            - option "경기 고양시 일산동구"
            - option "경기 고양시 일산서구"
            - option "경기 화성시"
            - option "경기 파주시"
            - option "경기 용인시 처인구"
            - option "경기 용인시 기흥구"
            - option "경기 용인시 수지구"
            - option "경기 김포시"
            - option "인천 중구"
            - option "인천 동구"
            - option "인천 미추홀구"
            - option "인천 연수구"
            - option "인천 남동구"
            - option "인천 부평구"
            - option "인천 계양구"
            - option "인천 서구"
            - option "부산 중구"
            - option "부산 서구"
            - option "부산 동구"
            - option "부산 영도구"
            - option "부산 부산진구"
            - option "부산 동래구"
            - option "부산 남구"
            - option "부산 북구"
            - option "부산 해운대구"
            - option "부산 사하구"
            - option "부산 금정구"
            - option "부산 강서구"
            - option "부산 연제구"
            - option "부산 수영구"
            - option "부산 사상구"
            - option "부산 기장군"
        - generic [ref=e23]:
          - generic [ref=e24]: 계약월
          - combobox [ref=e25]:
            - option "2026년 11월" [selected]
            - option "2026년 10월"
            - option "2026년 9월"
            - option "2026년 8월"
            - option "2026년 7월"
            - option "2026년 6월"
            - option "2026년 5월"
            - option "2026년 4월"
            - option "2026년 3월"
            - option "2026년 2월"
            - option "2026년 1월"
            - option "2025년 12월"
        - button "조회" [ref=e26] [cursor=pointer]
      - generic [ref=e28]:
        - heading "평형별 필터" [level=3] [ref=e29]
        - generic [ref=e30]:
          - button "전체" [ref=e31] [cursor=pointer]
          - button "~60㎡ (소형)" [ref=e32] [cursor=pointer]
          - button "60~85㎡ (중형)" [ref=e33] [cursor=pointer]
          - button "85~135㎡ (대형)" [ref=e34] [cursor=pointer]
          - button "135㎡~ (초대형)" [ref=e35] [cursor=pointer]
          - button "직접 입력" [ref=e36] [cursor=pointer]
  - alert [ref=e37]
```

### 전체 검증

- `npm test -w @zipath/web -- --runInBand`: exit 0, 11 suites / 51 tests passed (기존 월 옵션 테스트 포함).
- `npm test -w @zipath/api`: exit 1, 10 suites passed / 10 suites 컴파일 실패, 실행된 테스트 88 passed. `@nestjs/typeorm`, `typeorm` 등 의존성 해석 실패이며 API 코드는 변경하지 않았다.
- `npx turbo lint`, `npx turbo build`: 최초 exit 0은 각각 FULL TURBO 캐시 5/5, 3/3. 현재 실행의 통과로 보지 않는다. 캐시를 배제한 `npx turbo lint --force`, `npx turbo build --force`는 각각 exit 2. 공통 선행 작업 @zipath/db build에서 `typeorm` 모듈 누락으로 실패.
- `npx tsc --noEmit --incremental false -p apps/api/tsconfig.json`: exit 2, TypeORM/jose/passport-apple 등 설치 의존성 누락.
- `npx tsc --noEmit -p apps/web-e2e/tsconfig.json`: exit 0.
- `npx tsc --noEmit --incremental false -p apps/web/tsconfig.json`: 병렬 build 중 .next 타입 파일 소실로 첫 실행 exit 2. build 종료 후 같은 명령을 순차 실행해 exit 0. 최종 타입 검사는 정상이다.
- 추가 gh run log 조회는 캐시 쓰기 EPERM으로 실패(exit 1), jobs/status는 조회 성공했으며 상세 실패 이유는 추정하지 않는다.
- 새로운 의존성·제품 코드·영구 테스트 변경 없음. 재설치와 배포 수정을 하지 않고 환경 제약 및 운영 실패를 분리해 보존했다. simplify/최종 품질 검토는 사용자 지시에 따라 후속 review가 담당한다.

API 테스트 실패 발췌

```text
npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.

> @zipath/api@0.1.0 test
> jest --config jest.config.js --runInBand

FAIL src/payment/payment.service.spec.ts
  ● Test suite failed to run

    [96msrc/payment/payment.service.spec.ts[0m:[93m3[0m:[93m36[0m - [91merror[0m[90m TS2307: [0mCannot find module '@nestjs/typeorm' or its corresponding type declarations.

    [7m3[0m import { getRepositoryToken } from "@nestjs/typeorm";
    [7m [0m [91m                                   ~~~~~~~~~~~~~~~~~[0m
    [96msrc/payment/payment.service.spec.ts[0m:[93m4[0m:[93m43[0m - [91merror[0m[90m TS2307: [0mCannot find module 'typeorm' or its corresponding type declarations.

    [7m4[0m import { Repository, ObjectLiteral } from "typeorm";
    [7m [0m [91m                                          ~~~~~~~~~[0m

FAIL src/checklist/checklist.service.spec.ts
  ● Test suite failed to run

    [96msrc/checklist/checklist.service.spec.ts[0m:[93m3[0m:[93m36[0m - [91merror[0m[90m TS2307: [0mCannot find module '@nestjs/typeorm' or its corresponding type declarations.

    [7m3[0m import { getRepositoryToken } from "@nestjs/typeorm";
…
    [7m  [0m [91m                                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m


Test Suites: 10 failed, 10 passed, 20 total
Tests:       88 passed, 88 total
Snapshots:   0 total
Time:        8.097 s, estimated 40 s
Ran all test suites.
npm error Lifecycle script `test` failed with error:
npm error code 1
npm error path /Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/apps/api
npm error workspace @zipath/api@0.1.0
npm error location /Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/apps/api
npm error command failed
npm error command sh -c jest --config jest.config.js --runInBand
```

강제 lint 실패 발췌

```text
npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
 WARNING  No locally installed `turbo` found in your repository. Using globally installed version (2.8.14), which can cause unexpected behavior.

Installing the version in your repository (^2.3.0) before calling `turbo` will result in more predictable behavior across environments.
• turbo 2.8.14
• Packages in scope: @zipath/api, @zipath/config, @zipath/db, @zipath/types, @zipath/ui, @zipath/web, @zipath/web-e2e
• Running lint in 7 packages
• Remote caching disabled, using shared worktree cache
@zipath/ui:lint: cache bypass, force executing 17e77b74527bb6ce
@zipath/types:lint: cache bypass, force executing 8778b01a601703b6
@zipath/db:build: cache bypass, force executing 9cb31c729947ff4c
@zipath/web:lint: cache bypass, force executing 22c8c55aec815e2a
@zipath/types:lint: npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
@zipath/ui:lint: npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
@zipath/db:build: npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
@zipath/web:lint: npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
@zipath/types:lint:
@zipath/types:lint: > @zipath/types@0.1.0 lint
@zipath/types:lint: > tsc --noEmit
@zipath/types:lint:
@zipath/web:lint:
@zipath/web:lint: > @zipath/web@0.1.0 lint
@zipath/web:lint: > next lint
…
@zipath/db:build: npm error code 2
@zipath/db:build: npm error path /Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db
@zipath/db:build: npm error workspace @zipath/db@0.1.0
@zipath/db:build: npm error location /Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db
@zipath/db:build: npm error command failed
@zipath/db:build: npm error command sh -c tsc
@zipath/db:build: ERROR: command finished with error: command (/Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db) /Users/sujeong/.nvm/versions/node/v22.13.0/bin/npm run build exited (2)
@zipath/db#build: command (/Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db) /Users/sujeong/.nvm/versions/node/v22.13.0/bin/npm run build exited (2)

 Tasks:    1 successful, 4 total
Cached:    0 cached, 4 total
  Time:    2.322s
Failed:    @zipath/db#build

 ERROR  run failed: command  exited (2)
```

강제 build 실패 발췌

```text
npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
 WARNING  No locally installed `turbo` found in your repository. Using globally installed version (2.8.14), which can cause unexpected behavior.

Installing the version in your repository (^2.3.0) before calling `turbo` will result in more predictable behavior across environments.
• turbo 2.8.14
• Packages in scope: @zipath/api, @zipath/config, @zipath/db, @zipath/types, @zipath/ui, @zipath/web, @zipath/web-e2e
• Running build in 7 packages
• Remote caching disabled, using shared worktree cache
@zipath/db:build: cache bypass, force executing 9cb31c729947ff4c
@zipath/web:build: cache bypass, force executing 1e3e683ac3442f1e
@zipath/db:build: npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
@zipath/web:build: npm warn Unknown project config "auto-install-peers". This will stop working in the next major version of npm.
@zipath/db:build:
@zipath/db:build: > @zipath/db@0.1.0 build
@zipath/db:build: > tsc
@zipath/db:build:
@zipath/web:build:
@zipath/web:build: > @zipath/web@0.1.0 build
@zipath/web:build: > next build
@zipath/web:build:
@zipath/web:build:   ▲ Next.js 14.2.35
@zipath/web:build:
@zipath/web:build:    Creating an optimized production build ...
…
@zipath/db:build: npm error code 2
@zipath/db:build: npm error path /Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db
@zipath/db:build: npm error workspace @zipath/db@0.1.0
@zipath/db:build: npm error location /Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db
@zipath/db:build: npm error command failed
@zipath/db:build: npm error command sh -c tsc
@zipath/db:build: ERROR: command finished with error: command (/Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db) /Users/sujeong/.nvm/versions/node/v22.13.0/bin/npm run build exited (2)
@zipath/db#build: command (/Users/sujeong/personal/github/sj48695-labs/zipath/.worktrees/128-react-hydration-7/packages/db) /Users/sujeong/.nvm/versions/node/v22.13.0/bin/npm run build exited (2)

 Tasks:    0 successful, 2 total
Cached:    0 cached, 2 total
  Time:    2.683s
Failed:    @zipath/db#build

 ERROR  run failed: command  exited (2)
```

기존 staged 증거는 `9444f6f`에 보존했고, Phase 1 시도 기록은 `2767448`에 커밋했다. 두 phase는 합격하지 않아 `(완료)` 표시를 추가하지 않았다. 최종 `git diff --check` 통과 후 plan·로그·대표 화면 2개를 [P2] 체크포인트에 함께 보존한다.
