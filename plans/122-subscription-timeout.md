# #122 청약 자격 확인 운영 대기·오류·재시도 검증

- 플랜식별자: `12878C82`
- 출처: [#122](https://github.com/sj48695-labs/zipath/issues/122), 특히 [2026-11-11 회의 댓글](https://github.com/sj48695-labs/zipath/issues/122#issuecomment-6773145905)
- 판정: 최신 본문과 회의 댓글에 따라 **기존 기능 재구현 없이 운영 검증**만 한다. #157은 CLOSED이고 PR #159는 `78e2077`로 병합되었으므로 과거의 이슈 상태 의존성은 해소됐다. 단, CLOSED가 운영 배포 성공을 뜻하지는 않는다.
- 현재 작업 위치: `.worktrees/122-subscription-timeout`, 브랜치 `122-subscription-timeout`, 조사 HEAD `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`.
- 사용자: 청약 입문자가 자격 확인 중 대기를 이해하고, 오류 후 같은 입력으로 다시 확인을 완료한다.
- 현재 호출은 plan 작성·커밋까지만. 후속 /code도 작업트리 정리, 브랜치 삭제, Ready/merge/auto-merge를 수행하지 않는다. Hold PR #155는 읽기 참고 이외 재사용·cherry-pick하지 않는다.

## 현재 구조와 근거

| 경로·심볼 | 확인한 동작 / 검증 선례 |
| --- | --- |
| `apps/web/src/app/subscription/page.tsx` — `SubscriptionPage`, `runSimulation`, `handleSubmit`, `handleRetry`, `lastPayloadRef` | `COLD_START_HINT_SECONDS = 10`, `REQUEST_TIMEOUT_MS = 45_000`. 제출 직후 `role=status`, 10초 뒤 서버 준비 안내, `finally`에서 버튼 복구. 재시도는 직전 payload를 재사용한다. |
| `apps/web/src/lib/api.ts` — `fetchApi`, `fetchResponse`, `ApiError` | API_BASE의 `/subscription/simulate`로 POST. AbortController timeout을 `kind=timeout`, 네트워크 실패를 `kind=network`로 정규화한다. 공유 API 및 호출자는 변경하지 않는다. |
| `apps/web/src/app/subscription/subscription-error.ts` — `getSubscriptionErrorViewModel` | timeout: `서버 준비 중이에요`, network: `네트워크 연결이 불안정해요`. 화면은 `role=alert`와 `다시 시도`를 제공한다. |
| `apps/web/src/app/subscription/subscription-error.test.ts`, `apps/web/src/lib/__tests__/api.test.ts` | 오류 모델·timeout 단위 테스트가 이미 있다. 같은 테스트를 복제하지 않는다. |
| `apps/web-e2e/tests/request-feedback.spec.ts` — `delayThenFail`, `expectRequestFeedback` | 10.25초 후 503 및 같은 입력 재전송을 확인한다. 10초 안내를 볼 여유가 짧다. 45초 abort·네트워크 단절·재시도 후 성공은 검증하지 않는다. 실거래가와 공유하므로 이번에는 수정하지 않는다. |
| `apps/web-e2e/tests/announcements.spec.ts` — 모바일 로딩 테스트 | resolve 함수를 보관하는 Promise로 응답을 보류하고 검증 후 해제하는 선례. 짧은 고정 지연에 기대지 않는다. |
| `apps/web-e2e/tests/production-smoke.spec.ts` — 운영 청약 테스트 | 최소 성공 fixture의 응답 모양, 법적 고지와 청약통장 필드, `page.route` 선례. 기존 smoke는 disabled 확인까지만 한다. |
| `apps/web-e2e/playwright.config.ts` | 기본 baseURL은 `https://zipath-web.vercel.app`, `ZIPATH_BASE_URL`로 변경 가능. Chromium, 기본 viewport는 desktop. 390px은 테스트 내 `setViewportSize` 선례를 사용한다. |
| `.github/workflows/production-web-regression.yml` | SHA 검증 후 production smoke. **불일치 시 실제 배포를 생성하는 workflow**라 이번 검증에서 dispatch하지 않는다. 현재 smoke 목록에 request-feedback는 없다. workflow 변경도 #122 범위 밖이다. |

기존 디자인은 `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`, `apps/web/src/components/layout/SiteHeader.tsx` 및 청약 화면의 토큰·카피를 따른다(match mode). 리디자인, 구현 용어 카피 수정은 이번 범위가 아니다.

### 운영 증거의 한계

- #122는 2026-06-28 재오픈되었고, 2026-09-18 본문·댓글은 배포 후 재검증으로 범위를 축소했다. 초기 댓글의 실거래가 일반화는 최신 지침에 따라 #158 소관이다. #128도 별도 범위다.
- 최근 Production web regression [run 35434014334](https://github.com/sj48695-labs/zipath/actions/runs/35434014334)는 `VERCEL_TOKEN repo secret is required to promote production.`으로 실패했다. 과거 실패 로그이며 현재 secret 유무를 단정하지 않는다.
- GitHub Production deployment 마지막 기록은 `e42afda31ec08f5969f9796315232ec92f1b9cd9` (2026-05-05). 이 기록만으로 **현재 Vercel alias가 제공하는 SHA를 확정할 수 없다**.
- `/tmp/pm-meeting-s8iAtT`는 존재하지 않는다. 사용자 PM 지침과 이슈의 최신 회의 댓글을 사용했다.
- plan 단계의 Playwright CLI 운영 접속 시도는 기본 npm 캐시 EPERM 후 `/tmp` npm 캐시로 우회했으나, 브라우저 daemon의 `~/Library/Caches/ms-playwright/daemon` 생성도 EPERM으로 종료했다. 브라우저 시각/흐름 검증은 아직 하지 못했다. 후속 실행에서는 허용된 daemon/cache 경로를 구성하거나 사용 가능한 브라우저 도구를 사용한다. 전역 캐시 소유권 변경은 하지 않는다.
- 기존 plan 파일은 없으며, 이전 구현 커밋 `49fe40e`, `bf210ff`, `498a8df`는 현재 HEAD 이력에 있다. PR #125/#144는 MERGED, #160은 CLOSED, #155는 OPEN Draft Hold이다. 이전 phase 번호를 재개하거나 닫힌 PR을 복구하지 않는다.

## 변경 파일

1. `apps/web-e2e/tests/subscription-recovery.spec.ts` (신규): 청약의 누락된 복구 계약만 검증.
2. `docs/verification/122-subscription-timeout.md` (신규): 운영 배포 증거와 실행 결과를 보존. plan 제거 여부와 무관하게 남는 결과물.

제품 코드, API/DB, fixture 패키지, export, 의존성, Playwright 전역 설정, CI는 변경하지 않는다. 공유 파일 추출이 없어 P0 prep은 필요 없다. 각 phase는 1개 관심사·1개 파일이며 약 45 turn 내 테스트·커밋 가능한 크기로 제한한다.

## Phase별 구현 계획

### Phase 1: 청약 대기·오류 후 성공 복구 계약 검증 (1파일, 커밋 단위)

- 상태: 미완료.
- /code 체크포인트: 6개 복구 계약 테스트 작성 및 E2E TypeScript 검사 통과. 운영은 법적 고지 검사에서 실패, 로컬은 첫 페이지 준비 지연으로 실패하여 GREEN 미확인. `[P1]` 체크포인트는 검증 완료를 뜻하지 않으며 후속 실행에서 GREEN 확인이 필요하다.
- 파일: `apps/web-e2e/tests/subscription-recovery.spec.ts`.
- 읽을 심볼: 위 표의 `runSimulation`, `handleRetry`, `getSubscriptionErrorViewModel`, `fetchResponse`.
- 선례: `production-smoke.spec.ts`의 청약 입력·성공 응답, `announcements.spec.ts`의 응답 보류, `request-feedback.spec.ts`의 payload 캡처와 동일성 비교.
- 1280×900 및 390×844에서 아래 3개 사례를 실행한다. 테스트 파일 내 viewport 반복만 사용하고 전역 projects나 공유 헬퍼를 만들지 않는다.
  1. **대기 후 정상 응답**: 응답을 Promise로 보류한다. 입력 age=31, income=4500, homelessMonths=24, dependents=2, savingsMonths=36 및 체크박스를 설정한다. 제출 직후 기본 안내·disabled를 확인하고 10초 안내 전환을 관찰한 뒤 성공 응답을 해제한다. 결과·가점 표시, `role=status` 소멸, 제출 버튼 enabled를 확인한다.
  2. **네트워크 실패 후 복구**: 첫 POST만 `route.abort('failed')`, 두 번째는 성공 fixture 반환. 네트워크 전용 alert, 재시도 버튼과 제출 버튼 enabled, 입력 유지, 재시도 payload/URL 동일성, 결과 표시, 이전 alert/status 제거를 확인한다. 503을 네트워크 오류의 대체 증거로 사용하지 않는다.
  3. **실제 45초 timeout 후 복구**: 첫 요청을 보류해 브라우저의 기존 AbortController가 중단하도록 둔다. 10초 안내와 45초 전 오류 미노출, 약 45초 이후 timeout 전용 alert·버튼 복구를 확인한다. 재시도는 성공 fixture로 응답하고 payload 동일성과 결과/상태 정리를 확인한다. HTTP 408 응답을 주입해 timeout 검증을 대신하지 않는다.
- 45초 사례만 `test.setTimeout(75_000)`와 timeout용 assertion 대기 예산을 둔다. 실제 경과 시간을 기록하고 스케줄링 오차를 허용하되 45초 전에 timeout 처리가 발생하면 실패한다. 테스트 기본 30초에 맡기지 않는다. 두 viewport를 제한된 workers로 실행해 자원 경합을 줄인다.
- 첫 보류 요청이 취소된 뒤 fixture를 fulfill하려고 하지 않도록 route lifecycle을 정리한다. 재시도 성공 fixture는 `results`, `points`, `totalPoints`, `maxPoints`, `message`를 갖추고 결과 heading을 확인한다. 테스트를 빨리 끝내려고 제품 timeout 상수를 변경하지 않는다.
- 화면에 같은 문구가 여럿이면 `getByRole('status')`, `getByRole('alert')`로 범위를 제한한다. 모바일에서 오류·재시도가 스크롤로 접근 가능하고 가로 넘침이 없는지도 확인한다.
- 실행:
  - `npm test -w @zipath/web -- --runInBand src/app/subscription/subscription-error.test.ts src/lib/__tests__/api.test.ts`
  - 로컬 web이 필요하면 기존 `npm run dev -w @zipath/web` 사용. API는 route mock으로 대체할 수 있다.
  - `ZIPATH_BASE_URL=http://localhost:3000 npm test -w @zipath/web-e2e -- subscription-recovery.spec.ts --project=chromium --workers=1 --retries=0`
- 로컬 성공은 운영 성공으로 기록하지 않는다. 실패가 테스트 환경 때문이면 캐시/브라우저 실행 환경을 바로잡고 다시 실행한다. 운영이 구버전이면 제품 코드를 재작성하지 않는다.
- 커밋 예: `test(web-e2e): #122 [P1] 청약 대기와 오류 후 복구 계약 검증`.

### Phase 2: 운영 SHA와 desktop/mobile 검증 결과 보존 (1파일, 커밋 단위)

- 상태: 미완료. Phase 1 이후 실행한다. 운영 배포 증거 확보가 성공 판정의 선행 조건이다.
- /code 체크포인트: `docs/verification/122-subscription-timeout.md`에 운영 실패와 배포 SHA 조회 차단 근거 기록. 수용 조건은 미완료로 유지한다.
- 파일: `docs/verification/122-subscription-timeout.md`.
- 선례: #122 최신 회의 댓글의 요구사항 및 `.github/workflows/production-web-regression.yml`의 Expected/Deployed SHA·Smoke URL 기록 항목. workflow 자체는 수정·실행하지 않는다.
- 읽기 전용 배포 조회/기존 workflow summary에서 운영 URL·Vercel deployment ID/URL·실제 source SHA·조회 시각(KST)을 기록하고, 검증 대상 develop SHA와 일치하거나 필요한 구현을 포함하는 후속 SHA인지 확인한다. GitHub의 오래된 deployment 기록이나 HTML에 필드가 있다는 사실만으로 SHA 일치를 주장하지 않는다.
- 권한/증거가 부족하거나 stale deployment이면 `BLOCKED: 운영 배포 SHA 확인/복구 필요`와 근거를 남긴다. #157 담당 후속 작업으로 연결하고 같은 실패 workflow를 재실행하거나 배포 복구·secret 변경을 하지 않는다. 그 상태에서도 수행 가능한 테스트 결과는 남기되 운영 수용 조건은 미완료로 유지한다.
- 운영 URL에서 Phase 1 spec을 실행: `ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- subscription-recovery.spec.ts --project=chromium --workers=1 --retries=0`. 정상 응답/오류 주입은 브라우저 route mock임을 표기한다.
- 별도로 운영 `/subscription`에서 route mock 없이 정상 자격 확인 한 번을 수행하고 실제 요청 URL·상태·소요 시간·결과/오류를 기록한다. 자연 콜드 스타트가 생기지 않아도 이를 억지로 만들지 않는다. 자연 대기와 제어된 지연 검증을 구분한다.
- Playwright로 desktop 1280×900 / mobile 390×844의 입력 전·loading(직후/10초 이후)·timeout·network·retry 후 success를 캡처한다. 청약에는 목록형 empty가 없으므로 초기 미입력 상태를 확인한다. 불필요한 empty UI를 만들지 않는다.
- 문서에 실행 명령·테스트한 소스 HEAD·배포 SHA·URL·viewport·동작·기대/관찰값·console/network·스크린샷/trace 위치를 남긴다. artifact는 `output/playwright/122/` 또는 실행 보고서에 저장하고 바이너리는 커밋하지 않는다. 링크는 실제로 보존된 경로/URL만 사용한다.
- 발견 분류: P0 주 흐름 실패/잘못된 결과, P1 대기 안내 또는 복구 불가, P2 읽기/접근성 불편, Skip 주관적 시각 취향. 동일 원인 증상은 #122에 함께 기록한다. 추가 구현·새 이슈·외부 댓글은 이 phase에서 하지 않는다.
- 검증: 보고서의 실제 실행 결과와 assertion/증거를 대조한다. 실패·미실행·SHA 불명은 PASS로 적지 않는다. 후속 파이프라인은 이 문서를 근거로 판단하며, 이번 작업에서 이슈를 닫지 않는다.
- 커밋 예: `docs(web): #122 [P2] 청약 운영 재검증 증거 기록`.

## 수용 조건

- [ ] 운영 배포 URL·source SHA와 검증한 소스의 관계가 확인된다.
- [ ] desktop/390px 모두 제출 직후 안내, 10초 이상 대기 안내와 disabled 중복 제출 방지가 보인다.
- [ ] 45초 timeout은 실제 요청 취소로 발생하며 전용 안내·재시도·버튼 복구가 확인된다.
- [ ] 네트워크 실패는 timeout/HTTP 오류와 구별되고 다시 실행할 수 있다.
- [ ] 재시도 요청은 직전 입력을 유지하고 성공 결과를 표시하며 이전 로딩/오류가 제거된다.
- [ ] 제어된 API 실패/성공과 실제 운영 API 확인 결과가 구별되어 기록된다.
- [ ] 기존 구현·Hold #155·#128/#158·배포 파이프라인을 변경하지 않는다.

## 자체 검토

2회 검토: 최신 축소 범위·기존 구현과 중복 없음·정확한 경로/심볼/선례·phase별 테스트/커밋·1파일 단위·운영 SHA 미확인과 테스트 PASS 구분을 확인했다. 기존 10.25초 테스트를 무작정 재실행하는 대신 응답 보류와 누락된 복구 사례로 검증한다. 배포 문제는 별도 책임으로 기록하며 계획만 남기고 완료로 처리하지 않는다.

Skills used: plan, ponytail(full), ui-design(match), playwright(운영 조사 및 후속 검증 절차).
