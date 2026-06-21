# #122 청약 자격 확인 API 타임아웃/에러 피드백

- 플랜식별자: `7F30723F`
- 출처: `#122`

## 현재 구조 분석

이슈 #122는 `/subscription` 에서 "자격 확인하기" 클릭 후 Render 콜드 스타트(약 30~35초) 동안
아무 피드백이 없다는 문제다. 그러나 이미 머지된 **#110** 작업으로 상당 부분이 선구현되어 있다.

**이미 구현됨 (#110, develop 에 머지됨):**

- `apps/web/src/lib/api.ts` — `fetchApi` 가 `AbortController` 기반 타임아웃 지원 (`DEFAULT_TIMEOUT_MS = 60_000`,
  옵션 `timeoutMs`). 타임아웃 시 `ApiError(408, "요청 시간이 초과되었습니다...")` 로 변환. (api.ts:25, :77-102)
- `apps/web/src/app/subscription/page.tsx` — 호출 시 `timeoutMs: 60_000` 지정 (page.tsx:71).
  로딩 중 `elapsedSeconds` 추적(page.tsx:46-56), 10초 경과 시 콜드 스타트 안내 박스 + 버튼 텍스트
  "서버 준비 중..." 표시(page.tsx:58, :179-181, :185-195). 에러 박스 표시(page.tsx:197-204).

**#122 에서 남은 간극 (PM 지침 기준):**

1. 타임아웃 값이 60초 → **PM 지침은 45초**. (`timeoutMs: 45_000` 으로 조정)
2. **로딩 스켈레톤 없음** — 현재는 버튼 텍스트만 바뀔 뿐, 결과 영역에 시각적 로딩 표시(스켈레톤)가 없다.
3. **재시도 버튼 없음** — 에러 박스에 텍스트만 있고, 네트워크/타임아웃 오류 시 재시도 버튼이 없다.
   (재시도하려면 폼을 다시 제출해야 함)
4. **타임아웃 안내 메시지** — 콜드 스타트 안내는 있으나, 45초 초과로 실제 타임아웃(408)이 발생했을 때의
   에러 메시지도 "서버 준비 중" 맥락으로 다듬는다.

테스트 인프라: `apps/web` 유닛 테스트는 없음. `apps/web-e2e` (Playwright, dev URL 대상, optional)에
`header-nav.spec.ts` 만 존재. subscription 전용 e2e 없음.

## 변경 파일

- `apps/web/src/app/subscription/page.tsx` (주 변경: 타임아웃 값, 재시도, 스켈레톤, 메시지)

> 단일 파일 변경이며 공통 상수/헬퍼 추출이 필요한 부분이 없으므로 별도 P0 prep 은 두지 않는다.

## Phase별 구현 계획

### Phase 1 (완료): 타임아웃 45초 조정 + 재시도 버튼 (커밋 단위)

- 변경 파일: `apps/web/src/app/subscription/page.tsx`
- 구현:
  - 호출부 `timeoutMs: 60_000` → `45_000` (PM 지침 45초). 상수로 추출(`REQUEST_TIMEOUT_MS = 45_000`)하여
    의도를 명확히 한다.
  - `handleSubmit` 의 요청 로직을 인자로 폼 payload 를 받는 재호출 가능한 함수로 정리하고,
    마지막 제출 payload 를 보관(`lastSubmittedRef` 또는 state)하여 재시도 시 동일 입력으로 재요청.
  - 에러 박스(page.tsx:197-204)에 **"다시 시도" 버튼** 추가 → 마지막 payload 로 재요청. `role="alert"` 추가.
- 테스트:
  - `npx turbo lint`, `npx turbo build` 통과.
  - 수동: 에러 상태에서 재시도 버튼 노출 및 클릭 시 동일 입력으로 재요청되는지 확인.

### Phase 2 (완료): 로딩 스켈레톤 + 타임아웃 안내 메시지 정리 (커밋 단위)

- 의존성: Phase 1 (동일 파일 render/handler 정리 위에 작업)
- 변경 파일: `apps/web/src/app/subscription/page.tsx`
- 구현:
  - 로딩(`loading === true`) 동안 결과 영역 자리에 **로딩 스켈레톤** 표시(결과 카드/가점 바 형태의
    `animate-pulse` placeholder). 기존 콜드 스타트 안내 박스는 유지.
  - 타임아웃(408) 등 에러 메시지를 "서버가 잠시 준비 중" 맥락으로 다듬어 사용자에게 재시도를 유도.
    (`ApiError.status === 408` 시 안내 문구 보강)
- 테스트:
  - `npx turbo lint`, `npx turbo build` 통과.
  - 수동: 제출 직후 스켈레톤 노출, 응답/에러 도착 시 스켈레톤 제거 확인.

## 테스트 계획

1. `npx turbo lint` — 린트 통과.
2. `npx turbo build` — 타입체크 + 빌드 통과.
3. 수동 브라우저 검증 (`npm run dev`):
   - 정상 응답: 제출 → 스켈레톤 → 결과 표시.
   - 콜드 스타트: 10초 경과 시 안내 박스 + 버튼 "서버 준비 중..." 표시.
   - 타임아웃(45초 초과): 408 에러 안내 + "다시 시도" 버튼 → 재시도 동작.
   - 네트워크 오류: 에러 박스 + 재시도 버튼 동작.
4. (optional) `apps/web-e2e` 에 subscription 로딩/에러 e2e 추가 검토 — 본 plan 범위 외, 필요 시 후속.
