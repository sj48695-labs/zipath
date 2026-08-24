# #152 공공분양 공고의 데이터 실패·빈 상태를 구분하고 복구 행동 제공

- 플랜식별자: `2c448a0a`
- 출처: #152

## 현재 구조 분석

- 공고 목록 화면은 `apps/web/src/app/announcements/page.tsx`의 클라이언트 컴포넌트 `AnnouncementsPage` 하나로 구성돼 있다. `useEffect` 안의 `fetchData()`가 `/api/announcements`를 호출하고, `announcements`, `totalCount`, `lastSyncedAt`, `loading`, `error` 상태를 갱신한다.
- 이 화면에는 이미 `loading` 스켈레톤(`role="status"`), 오류 알림(`role="alert"`), 일반 빈 목록(`showNoDataState`), 지역 필터 빈 목록(`showFilteredEmptyState`), `reloadAnnouncements()` 재시도, 상세/청약홈 링크가 있다. 다만 정상 목록을 볼 때는 `lastSyncedAt`과 공공 출처가 노출되지 않으며, #152의 네 가지 상태·재시도·모바일 완료 조건을 망라하는 E2E 검증도 없다.
- `apps/web/src/app/api/announcements/route.ts`는 백엔드의 `{ items, totalCount, page, limit, lastSyncedAt }` 응답을 프록시한다. 백엔드 `AnnouncementService.findAll()`은 `lastSyncedAt`을 ISO 문자열 또는 `null`로 반환한다.
- E2E 선례는 `apps/web-e2e/tests/announcements.spec.ts`다. `page.route("**/api/announcements**")`로 응답을 모킹하고 role/text 기반으로 검증한다. 현재 일반 빈 목록, 필터 빈 목록, HTTP 500 오류만 검증한다. UI 구현의 선례는 동일 화면의 `reloadAnnouncements`, `clearRegionFilter`, `CHEONGYAKHOME_URL` 및 `formatKoreanDateTime` 사용 패턴이다.

## 변경 파일

- `apps/web/src/app/announcements/page.tsx`
- `apps/web-e2e/tests/announcements.spec.ts`

## Phase별 구현 계획

### Phase 1: 공고 목록 상태 안내와 복구 흐름 완성 (커밋 단위)

- 변경 파일: `apps/web/src/app/announcements/page.tsx`, `apps/web-e2e/tests/announcements.spec.ts`
- 구현:
  - `AnnouncementsPage`의 성공 목록 분기에서 API의 `lastSyncedAt`을 사람이 읽을 수 있는 형식으로 표시하고 청약홈이 원문 출처임을 명시한다. 값이 `null`이면 날짜를 만들어 내지 않고 출처 안내만 유지한다.
  - 기존 상태 분기와 행동을 유지한다: `loading`의 스켈레톤/상태 텍스트, 오류 `role="alert"`의 메시지와 `reloadAnnouncements()`, 전체 빈 목록의 다시 불러오기, 필터 빈 목록의 `clearRegionFilter()`, 공통 청약홈 외부 링크. `page.tsx`에 이미 있는 `formatKoreanDateTime`, `CHEONGYAKHOME_URL`, `showNoDataState`, `showFilteredEmptyState`를 선례로 그대로 사용한다.
  - `announcements.spec.ts`의 `createResponse` 및 `page.route` 선례를 확장해, 지연된 응답 중 loading 상태, 정상 목록의 상세 CTA·갱신일·출처, 일반/필터 빈 결과, API 오류 후 `다시 시도`로 재요청되는 흐름을 검증한다. 모바일 완료 조건은 `page.setViewportSize({ width: 390, height: 844 })`에서 각 상태의 안내와 CTA가 보이는지 검사한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- announcements.spec.ts`로 상태별 라우트 모킹 E2E를 실행한다.
  - 가능하면 390px 뷰포트에서도 동일 E2E를 실행해 상태 메시지와 CTA가 viewport 안에 표시되는지 확인한다.

## 테스트 계획

1. 지연된 `/api/announcements` 응답에서 `role="status"`와 스켈레톤이 먼저 노출되고, 응답 후 정상 목록으로 전환되는지 확인한다.
2. 정상 응답에서 공고 제목, 내부 상세 링크 또는 공식 공고 링크, 마지막 갱신일, 청약홈 출처가 노출되는지 확인한다.
3. 빈 배열은 일반 빈 목록과 지역 필터 빈 목록을 서로 다른 안내·복구 행동으로 표시하는지 확인한다.
4. HTTP 오류는 빈 목록 없이 `role="alert"`와 재시도를 보여주며, 재시도 뒤 성공 응답을 다시 요청하는지 확인한다.
5. 390px 모바일 뷰포트에서 loading/empty/error 상태의 안내와 CTA가 표시되는지 확인한다.
