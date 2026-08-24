# #122 청약·실거래가 API 장기 대기 피드백 및 재시도 정책

- 플랜식별자: `E2A91C4F`
- 출처: [GitHub Issue #122](https://github.com/sj48695-labs/zipath/issues/122)
- 최신 이슈 확인: 2026-08-25 KST

## 변경 이력 반영

기존 계획은 청약 자격 확인 요청만 대상으로 했고 P1–P3은 완료 처리되어 있다. 2026-08-25 댓글은 같은 장기 대기가 `/real-price`의 단건 실거래가 조회에서도 재현됨을 추가했으며, 범위를 **공통 요청 timeout·재시도·오류 상태 정책**으로 일반화하고 두 화면의 회귀 검증을 요구한다.

완료된 P1–P3의 구현 및 완료 표시는 유지한다. 새 요구사항은 P4–P6에서 처리한다. `/real-price/compare`와 서버의 공공 API 연동 변경은 이번 범위에 포함하지 않는다.

## 현재 구조 분석

- `apps/web/src/lib/api.ts`의 `fetchApi()`는 `AbortController`와 `ApiError.kind`(`timeout`/`network`/`http`)를 제공하지만, `API_BASE`를 붙여 Nest API 응답을 unwrap하는 클라이언트다. 현재 same-origin Next.js API route를 직접 호출하는 실거래가 화면에는 사용할 수 없다.
- `apps/web/src/app/subscription/page.tsx`는 45초 요청 제한, 10초 후 Render 콜드 스타트 안내, 실패 후 동일 payload 재시도를 이미 갖췄다. `subscription-error.ts`가 오류 종류별 문구를 분리하며 관련 unit test도 있다.
- `apps/web/src/app/real-price/page.tsx`의 `handleSearch()`와 `handleTrendSearch()`는 `/api/real-price` 및 `/api/real-price/trend`를 직접 `fetch`한다. 두 요청 모두 timeout·오류 종류 분류·재시도 UI가 없고, 단건 조회는 스피너와 disabled 버튼만 노출한다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts`는 `/real-price`의 브라우저 선례이며, Playwright 설정은 `ZIPATH_BASE_URL`로 대상 환경을 바꿀 수 있다. 단위 테스트는 Jest 기반이다.

## 변경 파일

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/__tests__/api.test.ts`
- `apps/web/src/app/real-price/page.tsx`
- `apps/web/src/app/real-price/real-price-error.ts` (신규)
- `apps/web/src/app/real-price/real-price-error.test.ts` (신규)
- `apps/web-e2e/tests/request-feedback.spec.ts` (신규)

## Phase별 구현 계획

### Phase 1 (완료): 공통 API 오류 분류를 명시화

- 변경 파일: `apps/web/src/lib/api.ts`, `apps/web/src/lib/__tests__/api.test.ts`
- 구현: `ApiError.kind`와 `fetchApi()`의 abort/네트워크/HTTP 정규화를 추가해 timeout과 연결 실패를 구별한다.
- 선례: `apps/web/src/app/loan/page.tsx`, `apps/web/src/lib/__tests__/api.test.ts`
- 테스트: timeout은 `kind: "timeout"`·408, fetch 거부는 `kind: "network"`, HTTP 오류는 백엔드 메시지를 유지한다.

### Phase 2 (완료): 청약 자격 확인 사용자 메시지 분기

- 변경 파일: `apps/web/src/app/subscription/page.tsx`, `apps/web/src/app/subscription/subscription-error.ts`, `apps/web/src/app/subscription/subscription-error.test.ts`
- 구현: `runSimulation()`에 45초 제한과 10초 콜드 스타트 안내를 적용하고, `handleRetry()`가 마지막 payload를 재요청하도록 한다.
- 선례: `apps/web/src/app/loan/page.tsx`, `apps/web/src/app/subscription/subscription-error.test.ts`
- 테스트: timeout·network·HTTP 오류별 문구와 재시도 동선을 검증한다.

### Phase 3 (완료): 청약 화면 회귀 검증

- 변경 파일: Phase 1–2 변경 파일
- 구현: 법적 고지와 기존 API 호출 경로를 보존한 채 웹 테스트·빌드를 검증한다.
- 테스트: `npm test -w @zipath/web`, `npm run build -w @zipath/web`.

### Phase 4 (완료): same-origin 요청도 공통 timeout 오류 계약을 사용

- 변경 파일: `apps/web/src/lib/api.ts`, `apps/web/src/lib/__tests__/api.test.ts`
- 구현: `fetchApi()`가 쓰는 abort 및 `ApiError` 정규화 로직을, 응답 unwrap 없이 검증된 `Response`를 돌려주는 exported `fetchResponse()` 헬퍼로 추출한다. `fetchResponse()`는 timeout 기본값/명시값, 외부 abort, 네트워크 실패 및 non-OK HTTP 응답을 현재 `ApiError.kind`·`parseErrorBody()` 계약과 동일하게 처리한다. `fetchApi()`는 `fetchResponse()`를 사용하도록 정리해 기존 청약 동작을 바꾸지 않는다.
- 선례: `apps/web/src/lib/api.ts`의 `combineSignals()`·`fetchApi()`, `apps/web/src/lib/__tests__/api.test.ts`의 AbortController mock.
- 테스트: 짧은 `timeoutMs`에서 `timeout`/408, fetch 거부와 외부 abort에서 `network`, non-OK 응답의 backend message 보존, 정상 `Response`의 원문 반환을 unit test로 고정한다.

### Phase 5: 실거래가 단건·추이 조회에 대기 안내와 재시도 적용

- 의존성: Phase 4
- 변경 파일: `apps/web/src/app/real-price/page.tsx`, `apps/web/src/app/real-price/real-price-error.ts` (신규), `apps/web/src/app/real-price/real-price-error.test.ts` (신규)
- 구현: `real-price-error.ts`에 `ApiError.kind`를 사용자 문구·제목·보조 안내로 바꾸는 순수 `getRealPriceErrorViewModel()`을 둔다. timeout은 Render 서버 준비 안내와 재시도를, network는 연결 확인 안내를, HTTP/프록시 오류는 서버 메시지를 유지한다. `page.tsx`의 `handleSearch()`와 `handleTrendSearch()`는 `fetchResponse()`와 45초 timeout을 사용하고 각 마지막 요청 파라미터를 보존한다. 단건과 추이 화면 모두 10초 후 `role="status"`/`aria-live` 진행 안내(경과 시간 포함), 실패 후 해당 요청을 다시 실행하는 버튼, `role="alert"` 오류 상태를 표시한다. 기존 법적 고지, 결과/빈 결과 및 차트 loading 상태는 유지한다.
- 선례: `apps/web/src/app/subscription/page.tsx`의 `elapsedSeconds`, `showColdStartHint`, `handleRetry`, `apps/web/src/app/subscription/subscription-error.ts`, `apps/web/src/app/announcements/page.tsx`의 `role="status"`·`role="alert"` 패턴.
- 테스트: 순수 mapper에서 timeout/network/http 문구를 검증하고, 정상 결과와 기존 proxy `{ error: string }` 메시지 처리가 유지되는지 검증한다.

### Phase 6: 두 화면의 브라우저 회귀 계약 추가

- 의존성: Phase 5
- 변경 파일: `apps/web-e2e/tests/request-feedback.spec.ts` (신규)
- 구현: Playwright의 `page.route()`로 실제 외부 API에 의존하지 않는 지연·연결 실패 응답을 만들고 `/subscription`, `/real-price`의 사용자 흐름을 검증한다. 긴 대기에서는 진행/서버 준비 안내와 disabled 중복 요청 방지를, 실패 뒤에는 오류 `alert`와 재시도 버튼을 확인한다. 재시도 요청이 같은 subscription payload 및 real-price query를 다시 보내는지도 확인한다.
- 선례: `apps/web-e2e/tests/real-price-hydration.spec.ts`의 페이지 진입·locator 방식, `apps/web-e2e/tests/real-price-compare.spec.ts`의 기본 UI 검사.
- 테스트: `ZIPATH_BASE_URL=<검증 대상> npm test -w @zipath/web-e2e -- request-feedback.spec.ts`; unit test 및 production build도 함께 실행한다.

## 테스트 계획

1. `npm test -w @zipath/web` — 공통 same-origin timeout 헬퍼와 두 화면의 오류 mapper를 검증한다.
2. `npm run build -w @zipath/web` — client/server import 및 TypeScript strict 회귀를 확인한다.
3. `ZIPATH_BASE_URL=<검증 대상> npm test -w @zipath/web-e2e -- request-feedback.spec.ts` — Playwright route mock으로 subscription·real-price의 대기/오류/재시도를 검증한다.
4. 필요 시 `npx turbo lint` — 변경 파일의 lint를 확인한다.

## 완료 기준

- subscription과 real-price 단건/추이 조회가 45초 안에 완료되지 않으면 timeout으로 종료하고 다시 시도할 수 있다.
- 두 화면은 10초 이상 대기 시 Render 콜드 스타트 가능성과 경과 상태를 접근 가능한 방식으로 알린다.
- timeout, 네트워크 실패, 서버 HTTP 오류가 서로 다른 사용자 메시지로 표시되며 서버 메시지는 보존된다.
- 동일 입력/조회 조건으로 재시도하고, 기존 법적 고지 및 정상 결과·빈 결과 표시를 유지한다.
- `any`를 추가하지 않고 웹 unit test, build, 대상 E2E가 통과한다.
