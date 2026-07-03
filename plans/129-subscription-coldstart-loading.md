## Plan #129 청약 자격 시뮬레이션 콜드스타트 로딩/복구 상태 개선

- 플랜식별자: `C0LD129A`
- 출처: GitHub Issue #129

### 지시사항 (원본 보존)

> #129: 청약 자격 시뮬레이션 API 콜드스타트 중 로딩 상태 표시. 긴 대기 중 버튼 비활성화, 중복 제출 방지, 접근 가능한 로딩 문구 포함. 실패 시에는 입력값을 유지한 채 재시도할 수 있어야 한다.

### 결정 사항 (Q&A)

| 질문 | 결정 |
|------|------|
| 범위는 어디까지? | 청약 시뮬레이션 폼의 submit 경험만 수정한다. API 응답 포맷, 백엔드 로직, 다른 페이지는 건드리지 않는다. |
| 중복 제출 방지 기준은? | `loading` 상태만 믿지 않고, submit 진입부에 in-flight ref lock을 둬서 빠른 연속 클릭/Enter 연타를 모두 막는다. |
| 로딩 문구는 어디에 노출하나? | 버튼 텍스트 변경만으로 끝내지 않고, `role="status"` 또는 `aria-live="polite"` 영역에 보조 문구를 추가한다. `sr-only` 패턴은 선택지로 두되, 현재는 시각적으로도 읽히는 상태 문구를 함께 둔다. |
| 콜드스타트 안내는 유지하나? | 유지한다. 기존 10초 이후 안내는 그대로 두고, 대기 초반에도 접근 가능한 상태 문구가 보이게 보강한다. |
| 실패 복구는 포함하나? | 포함한다. 실패 시 입력값은 유지하고, 에러 메시지와 재시도 버튼을 제공해 같은 조건으로 다시 요청할 수 있게 한다. |
| 테스트는 무엇으로 하나? | 웹 컴포넌트 단위 테스트 인프라를 새로 늘리지 않고, `apps/web-e2e` Playwright에서 느린 `/subscription/simulate` 응답과 실패 응답을 가로채 검증한다. |

### 구현 단계 (Phase)

1. [x] **Phase 1 (완료): 청약 시뮬레이션 submit 로딩 락 + 접근 가능한 상태 문구 + 실패 복구 + E2E 회귀**
   - 파일:
     - `apps/web/src/app/subscription/page.tsx` (수정)
     - `apps/web-e2e/tests/subscription-loading.spec.ts` (신규)
   - 선례 파일:
     - `apps/web/src/app/announcements/[id]/page.tsx` - `role="status"` + `sr-only` 로딩 문구 패턴
     - `apps/web/src/app/loan/page.tsx` - submit 버튼 `disabled={loading}` 패턴
     - `apps/web-e2e/tests/real-price-compare.spec.ts` - Playwright 기본 렌더/입력 확인 패턴
   - 구현:
     - `SubscriptionPage`의 `runSimulation`, `handleSubmit`, `handleRetry`에 in-flight lock 추가
     - 버튼은 `loading` 동안 비활성화되고, 같은 요청이 두 번 시작되지 않도록 가드한다
     - 로딩 상태를 screen reader가 읽을 수 있게 `aria-live="polite"` 또는 `role="status"` 문구를 추가하고, 시각적 카피도 함께 정리한다
     - 실패 시에는 입력값을 유지하고, 에러 메시지와 재시도 버튼으로 복구 경로를 제공한다
     - 긴 대기 중에는 사용자가 현재 대기 상태임을 알 수 있게 버튼 라벨과 상태 문구를 일관되게 유지한다
   - 테스트:
     - 느린 응답을 `page.route()`로 흉내 내고, submit 직후 버튼이 비활성화되는지 확인
     - 같은 상태에서 연속 클릭/Enter에도 네트워크 요청이 1회만 나가는지 확인
     - 로딩 중 상태 문구가 DOM에 남아 접근 가능한 방식으로 노출되는지 확인
     - 502 실패 응답 후 에러 메시지, 입력값 유지, 재시도 버튼이 모두 동작하는지 확인
     - 재시도 시 새 요청이 발생하고 결과 화면으로 이어지는지 확인
   - 검증:
     - `npm test -w @zipath/web`
     - `npm run test -w @zipath/web-e2e`
   - 커밋:
     - `fix(web): #129 [P1] 청약 시뮬레이션 로딩 상태와 중복 제출 방지`

### 영향 범위

- **Web**
  - `apps/web/src/app/subscription/page.tsx`의 submit UX만 수정
  - 신규 E2E 스펙 1개 추가
- **API**
  - 변경 없음
- **DB**
  - 변경 없음

### 테스트 계획

- `apps/web/src/app/subscription/page.tsx`
  - 제출 직후 button disabled 상태가 켜지는지
  - 로딩 중 버튼 문구가 변경되는지
  - retry/submit 경로에서 중복 요청이 막히는지
- `apps/web-e2e/tests/subscription-loading.spec.ts`
  - `/subscription/simulate`를 지연 응답으로 가로채고 로딩 상태를 유지시키기
  - 빠른 재클릭 시 요청이 하나만 발생하는지 확인
  - `role="status"` 또는 `aria-live` 문구가 보조 기술용으로 렌더되는지 확인
