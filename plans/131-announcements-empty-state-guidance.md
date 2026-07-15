## Plan #131 공공분양 공고 페이지 빈 상태 안내 보강

- 플랜식별자: `B8F4C912`
- 출처: GitHub Issue #131 + PM 구현 지침
- 동일 배치 형제 이슈: `#123`

### 지시사항 (원본 보존)

> #131: 공공분양 공고 페이지 빈 상태에 이유와 다음 액션 안내 추가. 데이터 없음, 필터 결과 없음, API 실패 상태를 혼동하지 않게 분리하고 "참고용이며 법적 효력 없음" 고지를 UI에 포함할 것.

### 현재 코드 조사 결과

- `apps/web/src/app/announcements/page.tsx` 는 이미 공고 목록, 로딩 skeleton, 법적 고지를 렌더링한다.
- 현재 empty state 는 하나뿐이라, `데이터 없음` 과 `필터 결과 없음` 그리고 `API 실패` 를 서로 구분하지 못한다.
- 백엔드와 Next 프록시에는 `region` 필터가 이미 있으므로, 프론트에서 해당 필터를 쓰도록 열어주면 empty state 분기가 실제 UX로 연결된다.
- 법적 고지는 `LegalDisclaimer` 컴포넌트로 이미 목록/상세 상단에 들어가 있으므로, 이번 작업에서는 유지 여부를 회귀 테스트로 고정하는 데 집중한다.

### 결정 사항 (Q&A)

| 질문 | 결정 |
|------|------|
| 빈 상태를 어떻게 나누나? | `데이터 없음`, `필터 결과 없음`, `API 실패` 를 각각 별도 카드로 분리한다. |
| 필터는 무엇을 쓰나? | 공고 API가 이미 지원하는 `region` 필터를 프론트에서 노출한다. |
| 다음 액션은 무엇인가? | `다시 불러오기`, `필터 초기화`, `청약홈에서 직접 확인하기` 를 상황에 맞게 제공한다. |
| 법적 고지는 어디에 두나? | 목록 상단 `LegalDisclaimer` 를 유지하고 회귀 테스트로 고정한다. |

### 구현 단계 (Phase)

1. [ ] **Phase 1: 회귀 테스트 추가**
   - 파일:
     - `apps/web-e2e/tests/announcements.spec.ts` `# 새로 추가`
   - 구현:
     - 데이터 없음 상태에서 고지와 다음 액션이 보이는지 확인한다.
     - 지역 필터 적용 후 빈 결과가 나오면 `필터 결과 없음` 안내가 노출되는지 확인한다.
     - API 실패 시 빈 상태가 아니라 오류 카드와 재시도 CTA가 보이는지 확인한다.
   - 커밋:
     - `test(web): #131 공고 빈 상태 안내 회귀 테스트`

2. [ ] **Phase 2: 빈 상태 분기 구현**
   - 파일:
     - `apps/web/src/app/announcements/page.tsx`
   - 구현:
     - `region` 필터 입력과 초기화 액션을 추가한다.
     - empty state 를 데이터 없음 / 필터 결과 없음 / API 실패로 분리한다.
     - 각 상태에 맞는 다음 행동 문구와 버튼을 제공한다.
   - 커밋:
     - `feat(web): #131 공고 빈 상태 안내 분기 추가`

3. [ ] **Phase 3: 법적 고지 회귀 고정**
   - 파일:
     - `apps/web-e2e/tests/announcements.spec.ts`
     - `apps/web/src/app/announcements/_components/LegalDisclaimer.tsx` `# 필요 시 미세 조정`
   - 구현:
     - 공고 페이지에서 `참고용이며 법적 효력 없음` 고지가 계속 노출되는지 확인한다.
     - empty state 와 로딩/오류 UI 사이에서 고지 문구가 사라지지 않도록 유지한다.
   - 커밋:
     - `test(web): #131 공고 법적 고지 회귀 테스트`

4. [ ] **Phase 4: 검증**
   - 실행:
     - `npm test -w @zipath/api`
     - `npx turbo lint`
     - `npx turbo build`
     - `npm test -w @zipath/web-e2e`
   - 통과 기준:
     - 빈 상태가 상황별로 서로 섞이지 않는다.
     - 필터 초기화와 재시도 동작이 사용 가능하다.
     - 법적 고지가 공고 페이지 UI에 유지된다.
   - 커밋:
     - 검증 전용 커밋 없음

### 영향 범위

- 프론트엔드 전용: `apps/web`, `apps/web-e2e`
- 핵심 수정 후보:
  - `apps/web/src/app/announcements/page.tsx`
  - `apps/web-e2e/tests/announcements.spec.ts`
- 공통 정책:
  - `any` 금지, TypeScript strict 유지
  - 공공API 연동 범위와 백엔드 캐싱 로직은 건드리지 않음
  - 법적 고지 문구 유지

### 테스트 계획

- `npm test -w @zipath/web-e2e`
- `npx turbo lint`
- `npx turbo build`
- 수동 확인 시나리오:
  - `/announcements`
  - 필터 적용 후 빈 결과
  - API 실패 후 재시도
