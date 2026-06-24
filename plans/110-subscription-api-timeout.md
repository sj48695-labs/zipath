## Plan #110 청약 자격 확인 API 응답 대기 중 타임아웃/에러 피드백 추가 (Render 콜드 스타트)

- 플랜식별자: `5DA3DDD5`
- 출처: GitHub Issue #110 (https://github.com/sj48695-labs/zipath/issues/110)

### 지시사항 (원본 보존)

> 재현/현상: /subscription 에서 값을 입력하고 "자격 확인하기" 버튼을 누르면 버튼이 "확인 중..."(disabled)으로 바뀐 채 약 35초간 응답 없이 대기함. 이 시간 동안 진행 상태, 예상 소요 시간, 또는 타임아웃 안내가 전혀 표시되지 않음.
> 기대: 일정 시간(예: 10초) 이상 응답이 없으면 "서버가 잠시 준비 중입니다. 잠시 후 다시 시도해주세요." 같은 안내 또는 진행 표시가 필요하며, 네트워크 오류 시 버튼 재시도가 가능해야 함.
> 근거: network — `POST https://zipath-api.onrender.com/api/subscription/simulate` 요청이 약 30~35초 후 응답 (Render 무료 플랜 콜드 스타트). 그 사이 UI는 disabled 버튼만 표시.

### 결정 사항 (Q&A)

- **Q. 요청을 강제로 타임아웃시켜 끊어야 하나, 아니면 안내만 띄우고 계속 기다려야 하나?**
  A. 콜드 스타트는 정상 동작(30~35초 후 성공)이므로 **요청은 끊지 않는다**. 대신 약 10초 경과 시 "서버가 잠시 준비 중입니다" 안내를 표시한다. 단, 무한 대기를 막기 위해 `fetchApi`에 충분히 긴 안전 타임아웃(60초)을 두고, 초과 시에만 AbortController로 중단하고 에러로 전환한다.
- **Q. 재시도 UI는 어떻게?**
  A. 현재도 `finally`에서 `setLoading(false)`로 버튼이 다시 활성화되어 재시도 가능. 추가로 에러 메시지를 명확히("잠시 후 다시 시도해주세요") 유지하고, AbortError(타임아웃) 케이스를 별도 안내 문구로 구분한다.
- **Q. 진행 표시는 어디까지?**
  A. 토스트 라이브러리가 없으므로 기존 inline 알림 박스 패턴(`bg-amber-50` 안내 박스)을 재사용. 경과 초를 함께 노출해 사용자에게 진행 중임을 알린다.
- **Q. fetchApi 시그니처를 바꿔도 되나?**
  A. `FetchApiOptions`에 선택적 `timeoutMs?` 필드를 추가(하위 호환). 기존 호출부는 변경 불필요. 외부 `signal`을 넘긴 경우와 충돌하지 않도록 처리.

### 구현 단계 (Phase)

1. [ ] **Phase 1: `fetchApi`에 타임아웃/AbortController 지원 추가**
   - 파일: `apps/web/src/lib/api.ts`
   - 구현:
     - `FetchApiOptions`에 `timeoutMs?: number` 추가.
     - `fetchApi` 내부에서 `AbortController` 생성, `timeoutMs`(기본값 미지정 시 60_000ms) 후 `controller.abort()` 하는 `setTimeout` 설정.
     - 호출자가 `options.signal`을 직접 넘긴 경우 해당 signal의 abort도 전파(둘 중 하나라도 abort되면 중단). 가능하면 `AbortSignal.any([...])` 사용, 미지원 환경 fallback로 외부 signal에 `addEventListener('abort', ...)`.
     - `fetch`에 `signal` 전달, `finally`에서 `clearTimeout`.
     - abort로 인한 실패 시 `ApiError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.", 408)`로 변환하여 throw (호출부에서 일관되게 처리 가능).
   - 커밋: `feat(web): #110 fetchApi 타임아웃/AbortController 지원 추가`

2. [ ] **Phase 2: 청약 시뮬레이션 페이지에 진행/타임아웃 안내 UI 추가**
   - 파일: `apps/web/src/app/subscription/page.tsx`
   - 구현:
     - `loading` 동안 경과 시간을 추적하는 상태(`elapsedSeconds`)와 `useEffect` 타이머 추가(1초 간격, loading 종료 시 정리).
     - `elapsedSeconds >= 10`이면 버튼 아래/위에 안내 박스 표시: "서버가 잠시 준비 중입니다 (콜드 스타트). 보통 30초 이내에 응답해요. 잠시만 기다려주세요." + 경과 초 노출. 기존 빨강 에러 박스와 구분되는 amber(`border-amber-200 bg-amber-50 text-amber-700`) 스타일.
     - `fetchApi` 호출에 `timeoutMs: 60_000` 전달.
     - 버튼 라벨을 경과 시간에 따라 "확인 중..." → 10초 후 "서버 준비 중..." 등으로 보강(선택).
     - 에러 catch에서 408(타임아웃) ApiError 메시지를 그대로 노출하여 재시도 안내. `aria-live="polite"` 부여로 접근성 보강.
   - 커밋: `feat(web): #110 청약 시뮬레이션 대기 진행/콜드스타트 안내 표시`

3. [ ] **Phase 3: 테스트 추가 (fetchApi 타임아웃 동작)**
   - 파일: `apps/web/src/lib/__tests__/api.test.ts` (신규) 또는 web-e2e 대신 단위 테스트 환경 확인
   - 구현:
     - apps/web에 단위 테스트 러너가 없으면 web-e2e Playwright로는 콜드스타트 재현이 어려우므로, **우선 apps/web의 테스트 가능 여부 확인**. vitest/jest 미설치 시 Phase 3는 "수동 검증 + 코드 리뷰"로 대체하고 본 플랜에 명시.
     - 가능 시: `fetch`를 모킹하여 (a) `timeoutMs` 초과 시 408 `ApiError` throw, (b) 정상 응답 시 unwrap 동작, (c) 외부 signal abort 전파를 검증.
   - 커밋: `test(web): #110 fetchApi 타임아웃 동작 단위 테스트` (테스트 환경 없을 시 생략, 플랜에 사유 기록)

### 영향 범위

- `apps/web/src/lib/api.ts` — `fetchApi` 전 호출부에 영향. 단, `timeoutMs` 기본 60초 + 하위 호환 시그니처라 기존 동작(콜드스타트 정상 성공 케이스)은 깨지지 않음. announcements/notification 등 다른 호출부도 60초 안전망 적용됨(긍정적 부수효과).
- `apps/web/src/app/subscription/page.tsx` — UI/상태 추가, 기존 결과/에러 렌더링 로직 유지.
- 백엔드(api) 변경 없음. 공공API/DB 무관.

### 테스트 계획

- **단위(가능 시)**: `npm test -w @zipath/web` 또는 vitest로 `fetchApi` 타임아웃/정상/abort 전파 검증. (러너 부재 시 사유 명시 후 수동 검증)
- **수동 검증**:
  - 로컬에서 API_BASE를 지연 응답 mock(또는 throttle)으로 두고 `/subscription` 제출 → 10초 후 amber 안내 박스 노출 확인.
  - 60초 초과 강제 시 408 에러 메시지 노출 + 버튼 재활성화(재시도 가능) 확인.
  - 정상(빠른) 응답 시 안내 박스 미노출, 결과 정상 렌더 확인.
- **린트/빌드**: `npx turbo lint`, `npx turbo build`.

### 참고 (CLAUDE.md 정책)

- 결과 영역에 이미 "참고용" 고지 존재(225줄). 신규 안내 문구는 기능 안내이므로 별도 법적 고지 불필요.
- 토스트 라이브러리 미설치 → 기존 inline 알림 박스 패턴 재사용(의존성 추가 없음).
