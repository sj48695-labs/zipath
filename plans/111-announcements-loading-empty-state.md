## Plan #111 공공분양 공고 로딩/빈 상태 안내 보강

- 플랜식별자: `15BAABAA`
- 출처: `#111`
- 동일 배치 형제 이슈: `#128 #130 #127 #106 #52`

### 지시사항 (원본 보존)

> /announcements 로딩 중 빈 화면 대신 스켈레톤/스피너를 표시하고, empty state에는 마지막 동기화 시각 또는 데이터 출처 링크를 함께 보여준다. API 응답이 빈 목록이어도 사용자가 로딩 실패와 실제 빈 결과를 구분할 수 있어야 한다.

### 현재 코드 조사 결과

- `apps/web/src/app/announcements/page.tsx` 는 이미 `loading`, `error`, `lastSyncedAt`, `showNoDataState`, `showFilteredEmptyState` 를 분리하고 있다.
- 같은 파일에 `role="status"` 기반 skeleton 카드가 이미 있어서, 이번 작업은 "빈 화면 방지"를 새로 만드는 것보다 로딩 의도를 더 명확하게 보여주고 empty state 문구를 보강하는 UI 정리 성격이 강하다.
- `apps/web/src/app/api/announcements/route.ts` 와 `apps/api/src/announcement/announcement.service.ts` 는 이미 `lastSyncedAt` 를 내려주고 있으므로 백엔드 변경은 필요 없다.
- `apps/web-e2e/tests/announcements.spec.ts` 는 데이터 없음 / 필터 결과 없음 / API 실패는 이미 다루고 있지만, "로딩 중 상태" 와 "empty state 에서 동기화 시각 또는 출처 안내가 보이는지" 는 고정하지 않는다.
- 로딩 skeleton 선례는 `apps/web/src/app/subscription/page.tsx`, 중앙 로딩 선례는 `apps/web/src/app/announcements/[id]/page.tsx` 이다.

### 구현 단계 (Phase)

1. [x] **Phase 1: `/announcements` 로딩/empty-state UX 하드닝**
   - 변경 파일:
     - `apps/web/src/app/announcements/page.tsx`
     - `apps/web-e2e/tests/announcements.spec.ts`
   - 구현:
     - 로딩 영역에 현재 skeleton 을 유지하되, 사용자가 "불러오는 중" 임을 즉시 읽을 수 있는 짧은 spinner/status 문구를 추가한다.
     - 데이터가 비어 있을 때는 `lastSyncedAt` 가 있으면 마지막 동기화 시각을, 없으면 청약홈 출처 안내가 empty state 본문에서 바로 읽히도록 정리한다.
     - API 실패는 기존 오류 카드로 유지하고, empty state 와 겹치지 않도록 조건 분기를 그대로 보존한다.
   - 테스트:
     - 로딩 중 skeleton/status 가 먼저 보이는지 확인한다.
     - 빈 목록 응답에서 `lastSyncedAt` 문구가 보이는지 확인한다.
     - `lastSyncedAt` 가 없을 때는 청약홈 출처 안내가 남는지 확인한다.
     - API 실패 시 empty state 문구가 보이지 않는지 확인한다.
   - 커밋:
     - `feat(web): #111 공고 로딩 및 빈 상태 안내 보강`

### 영향 범위

- 프론트엔드 전용: `apps/web`, `apps/web-e2e`
- 핵심 수정 후보:
  - `apps/web/src/app/announcements/page.tsx`
  - `apps/web-e2e/tests/announcements.spec.ts`
- 변경하지 않는 영역:
  - `apps/api/src/announcement/announcement.service.ts`
  - `apps/web/src/app/api/announcements/route.ts`
  - TypeORM 엔티티 / DB 스키마

### 테스트 계획

1. `npm test -w @zipath/web-e2e`
2. `npx turbo lint`
3. `npx turbo build`
4. 수동 확인 시나리오
   - `/announcements` 첫 진입 시 로딩 skeleton/status 노출
   - 빈 목록 응답 시 마지막 동기화 시각 또는 청약홈 출처 안내 확인
   - API 실패 시 오류 카드와 재시도 CTA 확인
