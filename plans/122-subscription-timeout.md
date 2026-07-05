## Plan #122 청약 자격 확인 응답 대기 타임아웃 피드백 개선

- 플랜식별자: `E2A91C4F`
- 출처: GitHub Issue #122
- 브랜치: `122-subscription-timeout`
- 동일 배치 형제 이슈: `#128 #127 #132 #129 #123 #131 #130`
- 회의록: `/tmp/pm-meeting-1dH3g5` 는 현재 워크트리에 없음

### 지시사항 (원본 보존)

#122: 청약 자격 확인 API 응답 대기 중 타임아웃/에러 피드백 추가. Render 콜드 스타트와 네트워크 실패를 구분 가능한 사용자 메시지로 처리.

### 목표

청약 자격 확인 요청이 오래 걸리거나 실패할 때, 사용자가 현재 상황을 구분해서 이해할 수 있게 만든다.

- Render 콜드 스타트로 인한 지연
- 실제 네트워크 실패
- 백엔드가 내려준 일반 오류

### 범위

- 수정 범위는 우선 `apps/web` 로 제한한다.
- TypeScript strict 유지, `any` 추가 금지.
- 기존 법적 고지 문구(`참고용이며 법적 효력 없음`)는 유지한다.
- 공공API 연동 변경은 이번 이슈 범위 밖이다.

### 확인된 후보

1. `apps/web/src/lib/api.ts`
   - `fetchApi()`가 abort 를 `408` 으로 바꾸고 있지만, 네트워크 실패와 타임아웃을 사용자 레벨에서 더 분명하게 구분하려면 오류 메타데이터가 필요하다.
   - 현재 `ApiError` 는 `status` 중심이라, 408 이 Render 콜드 스타트인지 다른 실패인지 UI 쪽에서 구별하기 어렵다.

2. `apps/web/src/app/subscription/page.tsx`
   - `runSimulation()` 은 `ApiError` / 비-`ApiError` 만 나누고 있어 메시지 분기가 충분히 세밀하지 않다.
   - `elapsedSeconds`, `showColdStartHint`, `handleRetry` 가 이미 있어 사용자 피드백을 다듬기 좋은 위치다.

3. `apps/web/src/lib/__tests__/api.test.ts`
   - `timeoutMs` 경로와 abort 경로가 이미 있어, 네트워크 실패 분기까지 포함한 계약을 고정하기 좋다.

4. `apps/web/src/app/loan/page.tsx`
   - 같은 `fetchApi` / `ApiError` 조합을 쓰는 선례다.
   - 이슈의 핵심은 subscription 화면이므로 이 파일은 수정 대상이 아니라 패턴 참고용이다.

### Phase 1 (완료): 공통 API 오류 분류를 명시화

#### 작업

- `apps/web/src/lib/api.ts`
  - `ApiError` 에 timeout / network / http 를 구분할 수 있는 최소 메타데이터를 추가한다.
  - `fetchApi()` 의 `AbortError` 는 timeout 으로 정규화하고, fetch 자체 실패는 network failure 로 정규화한다.
  - 기존 `unwrapBackendData()` 와 `getBackendErrorMessage()` 동작은 유지한다.
- `apps/web/src/lib/__tests__/api.test.ts`
  - timeout 이 Render 콜드 스타트 설명으로 이어질 수 있는지 검증한다.
  - 네트워크 실패가 timeout 과 다른 오류 종류로 들어오는지 검증한다.
  - HTTP 4xx/5xx 는 기존처럼 backend message 를 우선하는지 검증한다.

#### 선례 파일

- `apps/web/src/app/loan/page.tsx`
- `apps/web/src/lib/__tests__/api.test.ts`

#### 테스트 시나리오

- `timeoutMs` 초과 시 timeout 성격의 `ApiError` 가 나온다.
- `fetch` 가 네트워크 오류로 reject 될 때 timeout 과 다른 분류가 유지된다.
- 응답이 `ok = false` 일 때는 기존 backend 메시지가 유지된다.

### Phase 2 (완료): subscription 화면 사용자 메시지 분기

#### 작업

- `apps/web/src/app/subscription/page.tsx`
  - `runSimulation()` 의 catch 블록을 `ApiError` 종류 기준으로 분기한다.
  - timeout 은 Render 콜드 스타트 맥락의 안내 문구로, network failure 는 연결 불안정 문구로 표시한다.
  - `elapsedSeconds` 와 `showColdStartHint` 는 유지하되, 실제 에러 메시지와 중복되지 않게 정리한다.
  - 재시도 버튼은 그대로 유지하되, 각 실패 유형에서 기대 행동이 더 분명하게 보이도록 카피를 정돈한다.

#### 선례 파일

- `apps/web/src/app/subscription/page.tsx`
- `apps/web/src/app/loan/page.tsx`

#### 테스트 시나리오

- 45초 timeout 발생 시 "서버 준비 중" 류의 안내가 나오고 재시도 동선이 유지된다.
- 네트워크 실패 시 Render 콜드 스타트 안내와 다른 메시지가 나온다.
- 일반 backend 오류는 backend 가 내려준 메시지를 유지한다.
- 첫 렌더와 loading skeleton 은 현재와 동일하게 안정적으로 유지한다.

### Phase 3 (완료): 회귀 검증

#### 작업

- subscription 화면의 timeout / network / backend error 케이스를 다시 확인한다.
- 웹 테스트와 빌드를 돌려서 `ApiError` 타입 변경이 다른 화면에 파급되지 않았는지 확인한다.
- 법적 고지 문구와 기존 API 호출 경로가 그대로 남아 있는지 점검한다.

#### 확인 명령

- `npm test -w @zipath/web`
- `npm run build -w @zipath/web`
- 필요 시 `npx turbo lint`

### 완료 기준

- timeout 과 network failure 가 사용자 메시지 레벨에서 구분된다.
- Render 콜드 스타트는 retry 를 유도하는 안내로 표현된다.
- backend 오류는 backend 메시지를 유지한다.
- `any` 타입이 추가되지 않는다.
- 웹 테스트/빌드가 통과한다.
