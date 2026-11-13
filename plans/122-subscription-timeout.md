# #122 청약 자격 확인 운영 대기·오류·재시도 검증

- 플랜식별자: `12878C82` (기존 유지)
- 출처: [#122 본문](https://github.com/sj48695-labs/zipath/issues/122), [11월 11일 회의](https://github.com/sj48695-labs/zipath/issues/122#issuecomment-6773145905), [최신 11월 13일 회의](https://github.com/sj48695-labs/zipath/issues/122#issuecomment-6845472986), 사용자 PM 지침.
- plan 재작성: 완료. Phase 1·2 및 운영 수용 조건: 미완료.
- 판정: #157 CLOSED·PR #159 MERGED는 확인했으나 운영 배포 성공의 증거는 아니다. 기존 기능을 재구현하지 않고 운영에서 확인한다. subscription 흐름이 없는 audit로 해결 판정하지 않는다.
- 사용자·할 일·전환: 청약 입문자가 자격 확인 대기를 이해하고, 실패해도 입력을 유지한 채 다시 시도하여 결과를 확인한다.
- 실행·재개 기록은 옆 `122-subscription-timeout.log.md`에 분리했다. 기본 입력으로 읽지 않으며 특정 실패 증적이 필요할 때만 해당 부분을 읽는다.

## 최신 요구사항과 보존할 작업

11월 13일 댓글은 기존 10초 안내·45초 timeout·재시도 검증을 유지하면서 **성공·지연·timeout·실패 전반의 입력 보존**을 명시했다. 따라서 기존 테스트를 보강하되 제품 코드의 상태 처리를 그대로 재사용한다. HTTP 실패도 네트워크 실패와 구별해 같은 입력으로 성공까지 복구하는지 확인한다.

- 기존 Phase 1 테스트 작성 커밋 `8bf586b`와 재개 커밋 `caa2302`를 보존한다. 6개 테스트는 존재하지만 GREEN 미확인이므로 Phase 1은 계속 미완료다.
- Phase 2 기록 커밋 `8f45968`, `0884b07`, `3c10504`, `6c2fd5f`를 보존한다. 운영 SHA·실제 API 성공이 미확인이라 Phase 2도 미완료다. `[PN]` 커밋만으로 완료 처리하지 않는다.
- 기존 완료 마커는 없다. Phase 번호를 바꾸거나 기존 테스트·실패 증거를 삭제하지 않는다.
- 동일 배치 #128·#158은 별도 범위다. Hold PR #155는 재사용·cherry-pick하지 않는다.

## 현재 구조와 변경 범위

| 정확한 경로·심볼 | 현재 동작 / 활용 선례 |
| --- | --- |
| `apps/web/src/app/subscription/page.tsx` — `SubscriptionPage`, `runSimulation`, `handleSubmit`, `handleRetry`, `lastPayloadRef` | 10초 안내, 45초 timeout, `finally` 버튼 복구. 제출 payload를 ref에 보존하고 재시도에 사용. form은 응답 후 초기화하지 않는다. |
| `apps/web/src/app/subscription/subscription-error.ts` — `getSubscriptionErrorViewModel` | timeout/network/http/unknown 안내 분리. 호출자는 위 page 한 곳이며 기존 단위 테스트가 있다. |
| `apps/web/src/lib/api.ts` — `fetchApi`, `fetchResponse`, `ApiError` | `/subscription/simulate` POST, AbortController timeout/network/http 정규화, backend envelope 해제. 공유 호출자·정책 변경 없음. |
| `apps/web-e2e/tests/subscription-recovery.spec.ts` — `capture`, `expectSuccess`, viewport 반복 | desktop 1280×900 / mobile 390×844, 지연 후 성공·network 복구·실제 45초 복구 각 1개씩 총 6개. 오류 직후 입력은 확인하지만 성공·지연 시 입력 유지 및 HTTP 실패 후 성공은 빠져 있다. |
| `apps/web-e2e/tests/request-feedback.spec.ts` — `delayThenFail`, `expectRequestFeedback` | 10.25초 뒤 503과 payload 동일성 선례. 두 번째 요청도 실패하므로 성공 복구의 대체 증거가 아니다. 실거래가와 공유하므로 수정하지 않는다. |
| `apps/web-e2e/tests/announcements.spec.ts` — 모바일 로딩 테스트 | Promise로 응답을 보류했다가 해제하는 선례. |
| `apps/web-e2e/tests/production-smoke.spec.ts` — 운영 청약 테스트 | 입력/성공 fixture·route mock 선례. disabled 확인만 하므로 복구 증거로 사용하지 않는다. |
| `apps/web-e2e/playwright.config.ts`, `apps/web-e2e/package.json` | `ZIPATH_BASE_URL`, chromium project, 기본 30초. 대상 spec·workers를 제한하고 임시 환경 설정은 repo 전역 설정에 반영하지 않는다. |
| `.github/workflows/production-web-regression.yml` | Expected/Deployed SHA·URL 기록 선례. SHA 불일치 때 배포를 생성하므로 검증 목적으로 dispatch하지 않는다. |

디자인은 `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`, `apps/web/src/components/layout/SiteHeader.tsx`의 토큰·헤더·법적 고지를 유지한다(ui-design match mode). 초기 미입력 상태가 empty에 해당하며 새 empty UI는 만들지 않는다.

후속 변경은 아래 두 파일과 필요한 phase 완료 표기·옆 실행 기록에 한정한다. 제품 코드·API·DB·공유 fixture·exports·의존성·CI 변경은 계획하지 않는다. 공통 파일 추출이 없어 P0는 불필요하다. 기존 상태 처리의 실제 결함이 확인되면 증거와 필요한 수정 범위를 먼저 plan에 반영한다.

## Phase별 구현 계획

### Phase 1: 기존 복구 계약의 입력 보존·실패 검증 보강 (미완료)

- 파일: `apps/web-e2e/tests/subscription-recovery.spec.ts` 1개. 한 관심사·한 커밋이며 45 turn 안에서 보강→검증→커밋한다.
- 기존 6개 테스트와 `success`, `CapturedRequest`, `capture`, `expectSuccess`를 재사용한다. 위 표의 page/error/api 심볼은 읽기 참고이며 재구현하지 않는다.
- 숫자 입력 31/4500/24/2/36과 두 체크박스가 제출 직후, 10초 대기 중, 오류 후, 성공 후에도 유지되는지 확인한다. 파일 내부의 짧은 assertion 함수가 필요하면 기존 반복만 옮기며 공유 helper를 만들지 않는다.
- 기존 지연→성공 사례는 `announcements.spec.ts`의 응답 보류 방식 유지. disabled·직후 `role=status`·10초 안내를 확인한 뒤 성공 응답을 해제한다. 성공 시 결과/가점, 버튼 복구, 이전 alert/status 제거를 확인한다.
- network 사례는 첫 요청 `route.abort('failed')`, 두 번째는 성공. timeout 사례는 첫 요청을 보류해 기존 AbortController가 실제 45초에 중단하게 하고 두 번째는 성공. HTTP 408 주입이나 제품 timeout 단축으로 대체하지 않는다.
- 기존 failure 반복에 HTTP 503 사례를 추가한다(각 viewport 1개, 총 8개). `request-feedback.spec.ts`의 503 fixture 선례를 사용하되 첫 응답만 실패하고 재시도는 `success`를 반환한다. `청약 자격 확인에 실패했어요`·서버 메시지, 입력 유지, 버튼 복구, 재시도 후 성공을 확인한다.
- 모든 실패 복구에서 첫 payload가 기대값과 일치하고, 재시도 URL/method/body가 첫 요청과 동일한지 검증한다. retry가 성공하면 입력과 결과가 남고 이전 오류/로딩은 사라져야 한다.
- timeout만 기존 75초 예산을 유지한다. 40초 시점에 오류 없음·버튼 disabled, 약 45초 이후 timeout 전용 안내와 요청 취소를 확인한다. 현재 route handler 진입 후 경과 시간은 요청 시작보다 늦을 수 있으므로 45초 하한은 클릭/요청 직전 기준으로 측정해 정상 동작을 거짓 실패로 만들지 않는다. HTTP 오류나 네트워크 중단을 timeout으로 판정하지 않는다.
- 보류 route는 종료/취소 후 fulfill하지 않도록 정리한다. desktop/390px에서 initial/loading/error/success 캡처 및 가로 넘침·재시도 스크롤 접근을 확인한다.
- 선례: 위 표의 `request-feedback.spec.ts`, `announcements.spec.ts`, `production-smoke.spec.ts`와 현재 spec 자체.

검증 순서(이전 환경 실패를 그대로 반복하지 않음):

1. 설치된 Playwright 버전과 대응 browser executable 존재를 먼저 확인한다. 불일치하면 허용된 임시 browser 경로 또는 실행 파일을 지정하는 임시 config를 사용한다. 전역 캐시 권한 변경이나 의존성 갱신은 하지 않는다.
2. 이 worktree에서 **하나의 web 서버만** 실행하고 HTTP 200·청약통장 필드·고지가 확인된 후 테스트를 시작한다. dev와 build/start가 같은 `.next`를 동시에 쓰지 않도록 한다. 준비되지 않은 서버에 전체 spec을 반복하지 않는다.
3. network 사례 한 개로 서버/브라우저 readiness를 확인한 뒤 전체 8개를 `--workers=1 --retries=0`로 실행한다. 준비 실패는 환경 실패로 기록하며 assertion을 약화하지 않는다.
4. `npm test -w @zipath/web -- --runInBand src/app/subscription/subscription-error.test.ts src/lib/__tests__/api.test.ts`
5. `npx tsc --noEmit -p apps/web-e2e/tsconfig.json`
6. `ZIPATH_BASE_URL=http://127.0.0.1:<준비된 포트> npm test -w @zipath/web-e2e -- subscription-recovery.spec.ts --project=chromium --workers=1 --retries=0`

완료 조건: 두 viewport 총 8개 GREEN과 targeted/typecheck 종료 코드 확보. 환경 때문에 미실행이면 미완료다. 로컬 성공을 운영 성공으로 기록하지 않는다. 커밋: `test(web-e2e): #122 [P1] 청약 입력 보존과 실패 복구 검증 보강`.

### Phase 2: 운영 SHA·실제 흐름·화면 증거 기록 (미완료)

- 의존: Phase 1. 파일: `docs/verification/122-subscription-timeout.md` 1개. 운영 검증 기록 한 관심사·한 커밋, 약 45 turn 내 실행한다. 기존 기록은 삭제하지 않는다.
- 선례: 현재 검증 문서와 `.github/workflows/production-web-regression.yml`의 Expected/Deployed SHA·Smoke URL 항목. workflow를 실행하거나 수정하지 않는다.
- 읽기 전용으로 운영 URL에 연결된 deployment ID/URL/source SHA와 조회 시각(KST), 검증 소스 SHA·develop 기준 SHA를 기록한다. 소스가 일치하거나 필요한 page/error/api 구현을 포함하는지 대조한다. 과거 GitHub deployment, `x-vercel-id`, 필드 유무만으로 현재 alias SHA를 확정하지 않는다.
- 권한/배포 증거 부족 또는 구버전이면 `BLOCKED: 운영 배포 SHA 확인/복구 필요`로 남기고 #157 후속 운영 담당에 필요한 조건을 기록한다. 같은 실패 workflow/token 조회를 반복하거나 secret 변경·배포 복구를 수행하지 않는다. 가능한 관찰은 남겨도 운영 완료로 처리하지 않는다.
- 운영 preflight로 청약통장·법적 고지·페이지 로드가 확인되면 Phase 1 spec을 `ZIPATH_BASE_URL=https://zipath-web.vercel.app`로 실행한다. 구버전 화면 때문에 preflight가 실패하면 같은 assertion 실패를 8번 반복하지 않고 근거를 기록한다.
- route mock 성공/지연/503/network/timeout은 **배포된 프론트 상태 처리**의 증거로 표기한다. 실제 API 성공의 대체 증거가 아니다.
- mock 없이 실제 `/subscription` 자격 확인을 한 번 수행하고 URL/method/status·소요 시간·입력 유지·결과 또는 오류/재시도 동작을 기록한다. 실제 실패하면 복구 여부를 관찰하되 무한 재시도하지 않는다. 자연 콜드 스타트는 제어된 10초/45초 검증과 구분한다.
- desktop 1280×900 / mobile 390×844: 초기·제출 직후·10초 뒤·각 오류·재시도 성공 화면을 보존한다. console/network, 명령·종료 코드·테스트 수·시간·source/deployment SHA를 함께 기록한다. P0 주 흐름 실패, P1 대기/복구 차단, P2 읽기/접근성 불편, Skip 시각 취향으로 분류한다.
- 증거는 실제 보존된 artifact 경로/URL만 인용한다. 기존 artifact는 보존하고 새 바이너리는 무조건 추가하지 않는다. 동일 원인 증상은 #122 기록으로 묶고 새 이슈/외부 댓글은 만들지 않는다.
- 검증: 실행 결과와 보고서를 대조하여 실패·중단·SHA 불명을 PASS로 적지 않는다. 이번 변경에 무관한 API 전체 테스트를 다시 돌리지 않는다. 기존 API 전체 테스트 미완료 기록은 그대로 남긴다.

완료 조건: 배포 SHA 관계 확인, 운영 두 viewport 계약 GREEN, 실제 API 성공 및 입력 보존을 각각 증거로 확인. 어느 하나라도 없으면 Phase 2는 미완료다. 커밋: `docs(web): #122 [P2] 청약 운영 재검증 증거 기록`.

## 수용 조건

- [ ] 운영 deployment URL/source SHA와 검증 소스의 관계를 확인한다.
- [ ] desktop/390px에서 제출 직후 안내·10초 지연 안내·중복 제출 방지를 확인한다.
- [ ] 실제 45초 요청 취소와 timeout 전용 안내·재시도·버튼 복구를 확인한다.
- [ ] network/HTTP 실패 안내를 구분하고 같은 payload 재시도로 성공한다.
- [ ] 성공·지연·각 실패·재시도 성공에서 숫자 입력 및 체크박스가 보존된다.
- [ ] 재시도 성공 시 결과가 보이고 이전 alert/status가 제거된다.
- [ ] mock 계약과 실제 운영 API 결과를 구분하고, subscription 흐름 자체의 증거를 남긴다.
- [ ] 각 phase 완료 표기를 실제 결과에 맞추고 실행 기록은 옆 `.log.md`에 보존한다.

## 단계 경계와 자체 검토

이번 `/plan`은 조사·계획/기록 작성·plan 커밋만 한다. rebase·push·작업트리 전환/정리·브랜치 삭제·Ready·merge·auto-merge는 수행하지 않는다. 후속 /code에서도 파이프라인 cleanup/병합을 대신하지 않으며 Draft를 유지한다. 현재 브랜치의 열린 PR은 없고 Hold #155는 OPEN Draft로 남긴다.

자체 검토 2회 완료: 최신 댓글·축소 범위, 기존 `[PN]` 보존/미완료 판정, 입력 보존 누락 보강, 파일 1개씩의 phase 크기와 정확한 심볼/선례, 환경 readiness, 운영 SHA와 mock/실제 성공 구분을 확인했다. 계획 문서 변경만 있으므로 이번 단계의 제품 테스트는 실행하지 않는다.

Skills used: plan, ponytail(full), ui-design(match). 후속 브라우저 검증은 해당 실행 시 사용 가능한 Playwright/browser 스킬을 읽고 수행한다.
