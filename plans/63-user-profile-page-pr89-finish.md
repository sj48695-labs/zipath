# #63 유저 프로필 페이지 PR #89 마무리 계획

## 전제

- 대상 PR: #89, 브랜치 `63-user-profile-page` -> `develop`
- 현재 로컬 기준 변경 범위:
  - `apps/web/src/app/profile/page.tsx`
  - `apps/web/src/contexts/AuthContext.tsx`
  - `apps/web/src/app/api/auth/profile/interest-regions/route.ts`
  - `apps/api/src/auth/auth.controller.ts`
  - `apps/api/src/auth/auth.service.ts`
  - `apps/api/test/auth.service.spec.ts`
  - `apps/api/test/jwt.strategy.spec.ts`
  - `packages/db/src/entities/user.entity.ts`
  - `packages/db/src/migrations/1748000000000-AddUserInterestRegions.ts`
- PM 지침: Draft/승인/devloop 상태의 기존 구현을 유지하고, 충돌 해결/테스트/리뷰 반영만 수행한다.
- 형제 이슈 `#65`, `#96`, `#95` 및 수동 PR의 변경 영역과 충돌하지 않도록 #63 파일 범위 밖의 수정은 피한다.
- GitHub API 확인은 현재 네트워크 제한으로 실패했으므로, PR 리뷰/체크 상태 확인은 네트워크 가능 환경에서 재시도한다.

## Phase 1: PR 상태 및 충돌 확인

### Task 1.1: 최신 `develop` 기준 충돌 여부 확인

- `git fetch origin develop 63-user-profile-page` 후 `develop...HEAD` 변경 파일을 재확인한다.
- `git merge-tree` 또는 임시 merge/rebase dry-run 방식으로 충돌 파일을 확인한다.
- 충돌이 있으면 #63 소유 파일 안에서만 해결하고, 형제 이슈/수동 PR 영역은 보존한다.

테스트 시나리오:
- `git diff --check develop...HEAD`가 통과해야 한다.
- 충돌 해결 후 변경 파일 목록이 #63 범위를 벗어나지 않아야 한다.

## Phase 2: 리뷰 코멘트 반영

### Task 2.1: 미해결 리뷰 코멘트 수집

- `gh pr view 89` 및 리뷰 스레드 조회로 미해결 코멘트만 추린다.
- 이미 승인된 PR이므로, 코멘트 반영은 버그/테스트/명확성 개선에 한정한다.
- UI/데이터 모델 확장 요구는 새 이슈 후보로 분리하고 이번 PR에는 포함하지 않는다.

테스트 시나리오:
- 반영한 코멘트마다 수정 파일과 검증 명령을 기록한다.
- 반영하지 않은 코멘트는 사유를 PR 답변에 남길 수 있게 메모한다.

## Phase 3: API 검증

### Task 3.1: 관심 지역 저장 서비스 테스트 확인

- `AuthService.updateInterestRegions`의 저장, trim, 빈 값 제거, 중복 제거, 전체 삭제, 미존재 유저 예외 테스트를 유지한다.
- 컨트롤러의 `PATCH /auth/profile/interest-regions` 입력 검증은 문자열 배열/최대 20개 정책과 맞춰 확인한다.

테스트 시나리오:
- `npm test -w @zipath/api`
- 실패 시 #63 관련 테스트 또는 변경 파일에서 원인을 좁혀 수정한다.

## Phase 4: 웹 동작 검증

### Task 4.1: 프로필 페이지 인증 상태 확인

- 비로그인 상태에서 `/profile` 접근 시 로그인 안내와 `/login` 링크가 보이는지 확인한다.
- 로그인 사용자 상태에서 이메일, 닉네임, provider, 가입일, 마지막 활동 표시가 깨지지 않는지 확인한다.

테스트 시나리오:
- `npx turbo lint`
- 필요 시 `npx turbo build`
- 로컬 웹 실행이 가능하면 `/profile`에서 loading/unauthenticated/authenticated 상태를 수동 확인한다.

### Task 4.2: 관심 지역 UI 저장 흐름 확인

- 빈 입력, 중복 입력, 최대 20개 제한, 삭제, 저장 버튼 disabled 상태를 확인한다.
- 저장 성공 후 AuthContext의 user 상태가 API 응답으로 갱신되는지 확인한다.

테스트 시나리오:
- 브라우저 또는 컴포넌트 수동 검증으로 `PATCH /api/auth/profile/interest-regions` 호출 성공/실패 메시지를 확인한다.

## Phase 5: PR 마무리

### Task 5.1: 최종 변경 범위 정리

- `git status --short`와 `git diff --stat develop...HEAD`로 변경 범위가 #63에 머무는지 확인한다.
- 문서/계획 파일 외 불필요한 포맷 변경이나 형제 이슈 파일 변경이 있으면 제거한다.

테스트 시나리오:
- `git diff --check`
- `npm test -w @zipath/api`
- 가능하면 `npx turbo lint`와 `npx turbo build`

### Task 5.2: PR 업데이트 준비

- PR 본문 또는 댓글에 다음을 짧게 남긴다.
  - 충돌 해결 여부
  - 리뷰 반영 내역
  - 실행한 테스트와 결과
  - 남은 위험: GitHub API/CI 확인이 로컬 네트워크 제한 때문에 지연된 경우 명시

완료 기준:
- #63 기존 구현은 유지된다.
- 미해결 리뷰 코멘트가 없거나, 보류 사유가 PR에 명확히 남는다.
- API 테스트가 통과한다.
- 수동 PR 및 형제 이슈 변경 파일과 충돌하지 않는다.
