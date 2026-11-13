# #158 실거래가 운영 상태·재시도 검증

- 플랜식별자: `28F32CE5` (기존 ID 유지)
- 출처: https://github.com/sj48695-labs/zipath/issues/158
- 범위 판정: 본문 `현재 상태 (2026-09-18)` 및 [2026-11-13 회의 댓글](https://github.com/sj48695-labs/zipath/issues/158#issuecomment-6845472449)이 원래 Scope보다 우선한다. 운영 상태 UI 검증과 재현 결함의 최소 수정만 수행한다.
- 선행 #157은 CLOSED, PR #159 merge는 `78e2077`. 이 사실을 운영 배포 또는 조회 성공으로 취급하지 않는다.
- 계획 기준: 로컬 HEAD `84a25af`; 확인한 원격 브랜치 SHA `45eff5d45b49a3636740b8c3a8128c8515f720ca`. 현재 worktree에서 계획 문서만 커밋한다.
- **plan 재작성 완료 / 운영 수용 미완료.** P1~P3는 검증 코드 작성 체크포인트를 보존하고, 남은 검증은 P4/P5로 이어간다. 실행 이력은 `plans/158-real-price-state-verification.log.md`, 상세 증거는 `docs/verification/158-real-price.md`에 분리한다. 기록 본문을 기본 구현 입력으로 읽지 않는다.

## 사용자·디자인·범위

부동산 입문자가 지역과 계약월로 실거래가를 조회하고, 거래 내역이나 이해할 수 있는 상태 안내를 확인한 뒤 필요하면 같은 조건으로 다시 시도한다.

`ui-design` match mode: `apps/web/src/app/globals.css` 토큰, `apps/web/src/components/layout/SiteHeader.tsx`의 헤더·법적 고지, 기존 조회 버튼과 상태 안내를 유지한다. desktop 1280×900 / mobile 390×844에서 success/empty/timeout/error, loading, 재시도와 키보드 접근·가로 잘림을 확인한다. 발견은 P0 Broken/P1 Blocking/P2 Improving/Skip으로 분류한다.

telemetry, 신규 차트, 직전 거래월 추천, timeout·error view-model 재구현, 새 디자인·의존성·공통 helper, DB 변경은 제외한다. #128 hydration·콘솔 전반과 #122 청약 검증은 형제 범위다. 현재 호출에서 제품 코드·배포 설정은 수정하지 않는다. 후속 `/code`에서도 증거 없는 제품 수정은 하지 않는다.

## 현재 구조와 재사용할 코드

| 정확한 경로·심볼 | 확인한 동작·선례 |
| --- | --- |
| `apps/web/src/app/real-price/page.tsx`: `REQUEST_TIMEOUT_MS`, `runSearch`, `handleSearch`, `handleRetry`, `lastSearchUrlRef` | 45,000ms로 `fetchResponse` 호출, `finally`에서 loading 해제, 마지막 URL로 재시도. loading은 `role=status`·`aria-live=polite`, 오류는 `role=alert`. 기존 empty·거래 테이블 사용. |
| `apps/web/src/lib/api.ts`: `fetchResponse`, `ApiError` | AbortController로 timeout/network/http 구분. fetch가 resolve되면 timer를 해제한다. 헤더 뒤 body 지연은 미검증이며 결함으로 단정하지 않는다. 공유 호출자는 `fetchApi`, `fetchApiForm`, 실거래가 `runSearch`·`runTrendSearch`이므로 추측으로 이 공통 코드를 바꾸지 않는다. |
| `apps/web/src/app/real-price/real-price-error.ts`: `getRealPriceErrorViewModel` | timeout `서버 준비 중이에요`, HTTP `실거래가 조회에 실패했어요`. empty 안내와 구분한다. HTTP 504 mock을 client timeout 검증으로 대체하지 않는다. |
| `apps/web/src/app/api/real-price/route.ts`: `GET` | same-origin 요청을 backend `/real-price/search`로 프록시하고 오류 envelope를 정규화. 명시적 fetch timeout은 없지만 과거 Scope만으로 새로 추가하지 않는다. 브라우저 mock은 실제 프록시·upstream 검증이 아니다. |
| `apps/web-e2e/tests/real-price-status.spec.ts`: `monthSelect`, `openSearch`, `trade` | 두 viewport에서 loading→success/empty, HTTP error→동일 URL 재시도 success. 법적 고지·aria-live·CTA·키보드·가로 잘림 assertions와 screenshot이 이미 있다. |
| `apps/web-e2e/tests/real-price-timeout.spec.ts`: viewport/retryFirst 루프 | 보류 요청 A, clock 10초/44,999ms/45,000ms, abort 증거, 동일 조건 B 재시도 및 A 해제 뒤 UI 유지. abort를 무시하는 임의 fetch 경쟁까지 검증한 것으로 표현하지 않는다. |
| `apps/web-e2e/tests/real-price-production.spec.ts`: 실제 요청 테스트 | mock/clock 없는 운영 조회·동일 조건 재시도, request/response/terminal events와 screenshot. 전체 150초·종료 관찰 48초이므로 45초 계약 충족은 별도로 확인해야 한다. |
| `apps/web-e2e/playwright.config.ts`, `apps/web-e2e/package.json` | 기존 Chromium, 기본 운영 URL, `ZIPATH_BASE_URL` override. mock 검증은 준비된 로컬 URL을 명시한다. 전역 설정 변경은 하지 않는다. |
| `.github/workflows/production-web-regression.yml`: `smoke` | status/timeout/production spec은 이미 목록에 포함됐다. 앞 job은 배포 복구를 유발할 수 있으므로 검증 목적으로 workflow_dispatch하지 않는다. |

단위 테스트 선례: `apps/web/src/lib/__tests__/api.test.ts`의 `fetchResponse` timeout과 `apps/web/src/app/real-price/real-price-error.test.ts`의 오류 분류. 보조 E2E 선례: `apps/web-e2e/tests/request-feedback.spec.ts`의 URL 비교, `apps/web-e2e/tests/production-smoke.spec.ts`의 직접 접근·hydration 검사. 기존 검사를 복제하지 않는다.

## Phase별 계획

### Phase 1 (완료): success/empty/error 검증 코드 작성 [P1]

- 보존 커밋: `4a2910b`.
- 파일·심볼: `apps/web-e2e/tests/real-price-status.spec.ts`의 `openSearch` 및 viewport별 세 시나리오.
- loading/aria-live, 성공 테이블, empty 안내, HTTP 오류, 입력 변경 후 원래 URL 재시도, 버튼 복구·키보드·390px 검사를 구현했다.
- **완료는 코드 작성·커밋 기준이다. 전체 GREEN 및 운영 상태 검증은 P4/P5의 미완료 조건으로 유지한다.**

### Phase 2 (완료): timeout·늦은 응답 검증 코드 작성 [P2]

- 보존 커밋: `dd3c571`.
- 파일: `apps/web-e2e/tests/real-price-timeout.spec.ts`.
- 선례: P1의 응답 보류·URL 수집. 실제 client timer 분기, A abort, timeout 안내 유지 또는 B 성공 뒤 A의 늦은 종료를 검증하는 코드를 작성했다.
- 전체 GREEN은 P4에서 확인한다. HTTP 오류 mock만으로 timeout 완료 처리하지 않는다.

### Phase 3 (완료): 운영 spec·workflow 연결·기존 증거 보존 [P3]

- 보존 커밋: `c87d8b0`, 후속 `e0f1d20`·`84a25af`.
- 파일: `apps/web-e2e/tests/real-price-production.spec.ts`, `.github/workflows/production-web-regression.yml`, `docs/verification/158-real-price.md`. 과거 증거도 삭제하지 않는다.
- 선례: 기존 `production-smoke.spec.ts`, workflow `smoke` 목록.
- 실제 조회 spec과 실행 목록 연결은 작성됐다. **운영 API 성공·복구 UI 및 모든 수용 조건은 미완료**이며 P5에서 확인한다. 테스트를 새로 중복 작성하지 않는다.

### Phase 4 (완료): 준비된 환경에서 mock 네 상태·timeout 계약 확정 [P4]

- 의존성: P1/P2. 한 관심사: 기존 검증의 실행 가능성과 계약 확인.
- 변경 후보 (최대 4개): `apps/web-e2e/tests/real-price-status.spec.ts`, `apps/web-e2e/tests/real-price-timeout.spec.ts` (검증 코드 자체 결함이 재현된 경우만), `docs/verification/158-real-price.md`, `plans/158-real-price-state-verification.log.md`.
- 재현된 검증 준비 결함: 첫 방문 390px에서 쿠키 동의 배너가 timeout 재시도 클릭을 가로막는다. timeout spec은 실제 `동의` 버튼을 누른 뒤 timer 검증을 시작한다. 강제 클릭·기대값 완화는 하지 않는다. 배너가 열린 상태의 CTA 겹침은 별도 발견으로 보존한다.
- 정확한 심볼·선례: status의 `openSearch`·viewport 루프, timeout의 `page.clock.install`·`pauseAt`·보류 A/B, `request-feedback.spec.ts`의 URL 수집. 제품 timeout을 주입하거나 기대값을 완화하지 않는다.
- **먼저 환경 확인:** 현재 workspace의 Playwright 버전이 요구하는 Chromium과 headless shell 경로를 확인한다. 존재하지 않는 기본 경로/다른 revision을 반복 실행하지 않는다. 필요 시 설치된 Playwright CLI로 현재 버전의 Chromium을 임시 쓰기 가능 경로에 설치하고 `PLAYWRIGHT_BROWSERS_PATH`로 지정한다. 브라우저 한 번 launch 성공을 확인한 뒤 본 테스트로 넘어간다. 불가하면 환경 실패로 기록한다.
- 로컬 서버는 가용 포트와 파일 감시 한도를 확인한 뒤 `npm run dev -w @zipath/web -- --port <포트>`로 시작한다. Ready 로그만 믿지 말고 `/real-price` HTTP 응답과 컴파일 완료를 확인한 후 실행한다. EMFILE이면 polling을 적용한 서버 하나로 준비 확인하고, 계속 실패하면 준비된 기존 CI/브라우저 실행 환경을 후속 의존으로 남긴다. 같은 실패 서버를 반복 생성하지 않는다.
- 테스트: `ZIPATH_BASE_URL=http://localhost:<포트> npm test -w @zipath/web-e2e -- real-price-status.spec.ts real-price-timeout.spec.ts --workers=1` (검증한 browser path 함께 지정). 두 viewport 10건 전체 결과를 수집한다. 이 결과는 **로컬 mock UI 계약**이다.
- 44,999ms까지 loading, 45,000ms에 timeout 안내·조회 버튼 복구·재시도 CTA, empty 부재, 재시도 B success와 URL 유지, A 해제 뒤 UI 유지 및 abort 이벤트를 확인한다. clock 환경 문제가 재현되면 테스트별 제한을 75초 이상으로 두고 실제 45초를 기다리는 대안을 쓴다.
- 상태별 screenshot을 직접 보고 390px CTA·메시지 잘림과 키보드를 확인한다. 실행 중 서버·브라우저 준비 실패는 제품 결함으로 분류하지 않는다.
- 검증 코드 수정 시 `npx tsc --noEmit -p apps/web-e2e/tsconfig.json`. 보고서·log는 새 실행 결과/명령/exit/실패 원인을 기록하고 이전 증거를 유지한다.
- 완료: 10건 GREEN, 상태별 screenshot·키보드·모바일 확인. 불가하면 미완료로 유지하며 환경 의존을 명시한다.
- 커밋: `test(web): #158 [P4] 실거래가 상태 계약 검증 결과 확정`.

### Phase 5: 실제 운영 조회·제한시간·재시도 수용 검증 [P5]

- 의존성: P3, P4의 브라우저 준비. P4가 제품 검증에서 실패하면 운영 관찰은 가능하나 전체 완료로 처리하지 않는다.
- 변경 후보 (최대 3개): `apps/web-e2e/tests/real-price-production.spec.ts`의 실제 요청 테스트·`events`·`terminal`, `docs/verification/158-real-price.md`, `plans/158-real-price-state-verification.log.md`.
- 선례: 현재 production spec의 실제 request/response JSON attachment, `production-smoke.spec.ts`의 직접 접근. 새 운영 spec·workflow 연결은 이미 있으므로 추가하지 않는다.
- 운영 SHA는 읽기 전용 배포 메타데이터/확인 가능한 배포 증거로 조사한다. alias와 소스의 일치를 확정할 수 없으면 명시하고 종료 UI를 실제로 관찰한다. #157 CLOSED나 경로 HTTP 200은 요청 성공 증거가 아니다.
- **실제 조회는 mock·clock 없이 수행한다.** desktop/390px에서 지역·월을 기록하고 `조회`를 누른다. 법적 고지 등 별도 UI 실패를 유지하면서도 실제 request와 종료 증거를 수집한다. 로컬 mock의 `openSearch` 사전 assertion 실패로 운영 클릭 증거를 대신하지 않는다.
- 45초 계약과 assertion/관찰 여유를 분리한다. 기존 48초 poll 통과만으로 45초 계약 통과라 쓰지 않는다. 필요 시 production spec에 버튼 활성/종료 DOM의 전환 시점을 관찰·기록하고 기존 45초 기준을 평가한다. polling 뒤 기록한 `elapsedMs`만으로 실제 UI가 45초에 전환됐다고 단정하지 않는다. 경계가 불확실하면 재관찰하거나 미검증으로 남긴다.
- 요청 URL·지역/월·시작/종료·HTTP/실패·UI·버튼 상태·재시도 동일 URL을 attachment에 남긴다. 실제 error/timeout이면 같은 조건의 CTA 재시도와 종료를 확인한다. 성공 또는 empty는 해당 관찰만 증명하며 나머지 상태를 운영에서 관찰했다고 쓰지 않는다.
- 상태 안내·법적 고지·aria-live·키보드·390px CTA를 직접 확인한다. error/timeout이 적절히 복구되면 UI 계약과 API 성공 여부를 별도로 보고한다. 운영에서 발생하지 않은 상태의 계약은 mock 증거로 구분한다.
- 테스트: `ZIPATH_BASE_URL=https://zipath-web.vercel.app npm test -w @zipath/web-e2e -- real-price-production.spec.ts --workers=1`; 기존 `production-smoke.spec.ts`도 한 번 실행하고 형제 범위 실패를 분리한다. 검증 코드 변경 시 E2E `tsc --noEmit`을 실행한다.
- 보고서: 실행일 KST, URL, 소스 SHA/운영 SHA 및 근거, 명령/exit, 두 viewport의 실응답·mock 상태 표, 45초 판단, 버튼 복구·재시도·늦은 응답, screenshot/trace/JSON 경로, P0/P1/P2/Skip과 미검증 조건을 기록한다. 새 바이너리는 CI artifact/`output/playwright/`에 두고 과거 커밋 증거는 보존한다.
- 완료: 실제 요청·종료 증거가 두 viewport에서 확보되고 아래 수용 표에 공백이 없다. 관찰하지 못한 운영 상태는 명시하며 운영 pending/배포 불일치가 남으면 이슈 수용 미완료로 둔다.
- 커밋: `test(web): #158 [P5] 운영 조회 종료와 재시도 검증 기록`.

## 재현 결함이 있을 때의 확장 규칙

P4/P5에서 이슈 범위의 제품 결함이 재현된 경우에만 정확한 재현·원인·파일·심볼·선례를 plan에 추가하고 다음 번호의 작은 `[PN]` phase로 수정한다. 증상별 이슈 분리나 임의 리팩터링은 하지 않는다. 원인 하나/약 5개 파일 이내이며, 회귀 테스트→최소 수정→관련 테스트 및 동일 운영 흐름 재검증을 포함한다. 배포가 필요한 재검증은 배포 소유자의 후속 작업으로 남긴다.

후보는 `page.tsx`의 `runSearch`/`handleRetry`, `real-price-error.ts`의 `getRealPriceErrorViewModel`, `app/api/real-price/route.ts`의 `GET`와 해당 회귀 테스트다. 공유 `lib/api.ts`가 원인이면 `fetchResponse`의 모든 호출자와 기존 `lib/__tests__/api.test.ts`를 먼저 확인하고 별도 phase로 영향 범위를 적는다. body 지연 등은 재현 전 필수 수정으로 삼지 않는다. 구버전 운영/브라우저 실패를 현재 제품 재구현으로 해결하지 않는다.

## 수용 조건·미완료 조건

| 수용 조건 | 완료에 필요한 증거 |
| --- | --- |
| success 테이블 또는 명시적 empty | P4 두 viewport 계약 + P5 실제 관찰 상태 분리 |
| 45초 종료·버튼 enabled·재시도 CTA | P4 timer 경계 + P5 실시간 종료 관찰/한계 명시 |
| empty와 timeout/error 구분 | P4 상호 배타 assertion·상태별 screenshot |
| aria-live·desktop/390px·CTA 접근 | P4/P5 screenshot 직접 확인·키보드 조작 |
| 원래 조건 재시도·B 완료·A 덮어쓰기 방지 | P4 A/B 및 abort 증거 + P5 실제 오류 발생 시 재시도 |
| 실제 운영과 mock 구분 | P5 보고서의 상태 표·URL·SHA·request/terminal attachment |

검증 실패·중단·환경 실패·소스/배포 불일치는 성공으로 바꾸지 않는다. 기록으로 새 필수 조건이 발견되면 plan에도 반영한다. 완료 커밋은 보존하며 운영 수용 미완료 표시는 근거 확보 전 해제하지 않는다.

## 실행 경계와 보존

- 후속 phase마다 약 45 turn, 파일 5개 이하·관심사 하나. 공통 추출이 필요한 변경이 없어 P0는 만들지 않는다. 관련 없는 API 전체 테스트 반복은 필수 작업으로 추가하지 않는다.
- P5 후속 필수 조건: 현재 alias의 SHA/배포 소유자 확인 후 운영 45초 종료·법적 고지·재시도를 재검증한다. 종료 screenshot 수집이 test 예산을 소진한 제한이 있으므로 후속 실행에서는 실제 요청/terminal JSON을 우선 보존하고 부가 screenshot 수집 시간을 별도 제한한다. 구체적 실행 증거는 옆 log에 둔다.
- plan 완료 표시 또는 phase 완료 마커를 바꿀 때 옆 `.log.md`도 `git add -f`로 명시적으로 보존한다. phase 설계·미완료 조건은 plan에 두고 실행 결과는 log/보고서에 둔다.
- 이번 `/plan`은 조사·문서 갱신·plan 커밋까지만 수행한다. push, PR 생성·Ready·merge·auto-merge·배포, worktree 전환/제거, 브랜치 삭제·마무리 절차를 실행하지 않는다. PR이 존재하면 Draft를 유지하고 파이프라인 후속 단계에 넘긴다.
