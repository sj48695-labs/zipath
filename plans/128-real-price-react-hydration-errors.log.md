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
