# #122 plan 실행·재개 기록

이 파일은 실행 증적이다. `/plan`·`/code`의 기본 설계 입력은 옆 `122-subscription-timeout.md`이며, 실패 원인을 조사할 때 필요한 항목만 읽는다.

## 2026-11-13 기존 plan에서 분리한 기록

아래는 기존 plan의 운영 조사 및 재개 기록 원문이다. 당시 관찰이며 현재 상태로 단정하지 않는다. 설계·phase·미완료 조건은 plan에 유지했다.

### 운영 증거의 한계

- #122는 2026-06-28 재오픈되었고, 2026-09-18 본문·댓글은 배포 후 재검증으로 범위를 축소했다. 초기 댓글의 실거래가 일반화는 최신 지침에 따라 #158 소관이다. #128도 별도 범위다.
- 최근 Production web regression [run 35434014334](https://github.com/sj48695-labs/zipath/actions/runs/35434014334)는 `VERCEL_TOKEN repo secret is required to promote production.`으로 실패했다. 과거 실패 로그이며 현재 secret 유무를 단정하지 않는다.
- GitHub Production deployment 마지막 기록은 `e42afda31ec08f5969f9796315232ec92f1b9cd9` (2026-05-05). 이 기록만으로 **현재 Vercel alias가 제공하는 SHA를 확정할 수 없다**.
- `/tmp/pm-meeting-s8iAtT`는 존재하지 않는다. 사용자 PM 지침과 이슈의 최신 회의 댓글을 사용했다.
- plan 단계의 Playwright CLI 운영 접속 시도는 기본 npm 캐시 EPERM 후 `/tmp` npm 캐시로 우회했으나, 브라우저 daemon의 `~/Library/Caches/ms-playwright/daemon` 생성도 EPERM으로 종료했다. 브라우저 시각/흐름 검증은 아직 하지 못했다. 후속 실행에서는 허용된 daemon/cache 경로를 구성하거나 사용 가능한 브라우저 도구를 사용한다. 전역 캐시 소유권 변경은 하지 않는다.
- 기존 plan 파일은 없으며, 이전 구현 커밋 `49fe40e`, `bf210ff`, `498a8df`는 현재 HEAD 이력에 있다. PR #125/#144는 MERGED, #160은 CLOSED, #155는 OPEN Draft Hold이다. 이전 phase 번호를 재개하거나 닫힌 PR을 복구하지 않는다.


- 재개 체크포인트(2026-11-11): 기존 잔여 증거는 `3c10504`로 보존. 오류 모델/API targeted 26 tests 및 E2E tsc, 전체 lint/build 통과. 로컬 SSR에서 필수 고지 확인. Chromium 기본 버전 불일치는 설치된 브라우저를 지정하는 `/tmp/122-pw.config.ts`로 우회했으나 로컬 HTTP 500과 실행 지연으로 복구 계약 GREEN은 여전히 미확인. 구현을 재작성하지 않으며 phase 완료로 표시하지 않는다.

- /code 체크포인트: 6개 복구 계약 테스트 작성 및 E2E TypeScript 검사 통과. 운영은 법적 고지 검사에서 실패, 로컬은 첫 페이지 준비 지연으로 실패하여 GREEN 미확인. `[P1]` 체크포인트는 검증 완료를 뜻하지 않으며 후속 실행에서 GREEN 확인이 필요하다.

- /code 체크포인트: `docs/verification/122-subscription-timeout.md`에 운영 실패와 배포 SHA 조회 차단 근거 기록. 수용 조건은 미완료로 유지한다.

## 2026-11-13 plan 재검토

- 시작 HEAD: `6c2fd5fb777c8476f5dca94fab6dbf1d79a2951d`, 시작 작업 트리 clean.
- 최신 본문·전체 댓글을 `gh issue view 122 --json ...`로 확인. 11월 13일 댓글 `6845472986`은 성공·지연·timeout·실패에서 입력 보존/재시도를 명시하며, subscription이 없는 audit로 해결 판정하지 말라고 지시한다.
- `gh issue view 157`: CLOSED. `gh pr view 159`: MERGED (`78e2077f7bf2bdc2d23401ddb942b7f698bb81bd`). `gh pr view 155`: OPEN Draft. 변경하지 않았다.
- 원격 브랜치 SHA는 사용자 입력과 같은 `8228375b67e204817360e18a58aca59aa5f4c7f9`. 로컬 HEAD와 다르므로 reset/rebase/push하지 않았다. GitHub compare는 로컬 전용 SHA로 HTTP 404였으며, 로컬 git 객체와 원격 commit API를 읽는 방식으로 전환했다.
- 원격 SHA는 `0884b07`을 부모로 하는 `wip: 자동 저장 (DevLoop 종료)` 커밋. 완료된 검증의 증거로 사용하지 않는다.
- `gh run list`: 최신 Production web regression run `35434014334`는 failure. 마지막 GitHub Production deployment는 ID `4588149208`, SHA `e42afda31ec08f5969f9796315232ec92f1b9cd9` (2026-05-05). 현재 alias source SHA는 이번에도 확인하지 않았다.
- `/tmp/pm-meeting-ww5VhN`은 존재하지 않았다. 사용자 PM 지침과 최신 이슈 댓글을 근거로 사용했다.
- 이번 단계에서는 브라우저·제품 테스트를 재실행하지 않았다. 기존 검증 문서의 서버 경합/브라우저 경로 실패를 근거로 후속 실행에 단일 서버 readiness와 브라우저 사전 확인을 요구한다.
- 기존 `[P1]`/`[P2]` 커밋은 보존. 기존 plan과 검증 문서 모두 GREEN 미확인이라고 명시하므로 완료 마커를 만들지 않는다.
- 자체 검토 2회: 범위/댓글 반영, 기존 커밋 보존, phase 크기, 실행 환경 선행 조건, 운영 SHA와 PASS 구분, 기록 분리를 확인. plan 작성 단계 완료, 구현·운영 수용 조건 미완료.
