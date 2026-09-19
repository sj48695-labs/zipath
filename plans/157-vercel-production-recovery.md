# #157 Vercel 운영 배포 복구 실행

- 플랜식별자: `FA563FF2`
- 출처: `#157`

## 현재 구조 분석

- #159는 `2026-09-18`에 develop로 병합됐다. 배포·smoke 구현은 `.github/workflows/production-web-regression.yml`과 `apps/web-e2e/tests/production-smoke.spec.ts`에 이미 있다. #122, #128, #158의 UI는 이 이슈에서 변경하지 않는다.
- workflow의 `verify-production-deployment` job은 `VERCEL_TOKEN`으로 Vercel Production의 `meta.githubCommitSha`를 `EXPECTED_SHA`와 비교하고, 불일치하면 같은 SHA의 Production deployment를 생성·READY까지 대기한 뒤 URL/SHA를 summary와 smoke job에 전달한다.
- develop HEAD는 `071cc4f228d8fa9fc2a1a25936f892ba3ab4b357`이다. `35334203973`과 `35434014334` 실행은 모두 `VERCEL_TOKEN: ` 빈 값에서 즉시 실패했다. 따라서 복구 단계의 원인은 코드나 #122/#128/#158 UI가 아니라 누락된 repository secret이다.
- `/tmp/pm-meeting-eld9Kl`은 계획 시점에 존재하지 않아 열람하지 못했다. 이슈 본문·댓글·실패 로그를 우선 근거로 사용한다.

## 변경 파일

- 없음 — 이미 병합된 workflow와 smoke 계약을 재구현하지 않는다.

## Phase별 실행 계획

### Phase 1: Vercel 인증 복구 및 develop SHA 승격 (운영 실행 단위)

- 변경 대상: GitHub repository secret `VERCEL_TOKEN` (코드 파일 변경 없음)
- 선례: `.github/workflows/production-web-regression.yml`의 `verify-production-deployment` / `Compare and recover deployment`
- 구현:
  - 저장소 관리자가 Production deployment 생성 권한이 있는 Vercel access token을 `VERCEL_TOKEN` repository secret으로 등록한다. 값은 로그·plan·댓글에 기록하지 않는다.
  - `Production web regression`을 `workflow_dispatch`로 실행하고 `expected_sha`에 당시 develop HEAD를 전달한다. 실행 시점의 develop HEAD가 `071cc4f...`보다 앞서면 그 최신 SHA를 사용한다.
  - job summary의 Expected SHA와 Deployed SHA가 같고, GitHub Production deployment SHA 및 `https://zipath-web.vercel.app` smoke URL이 기록됐는지 확인한다. 이 단계는 현재 `/plan` 권한 밖의 운영 변경이며, 후속 실행에서만 수행한다.
- 테스트:
  - recovery job이 성공하고 Vercel deployment 상태가 `READY`인지 확인한다.
  - summary의 Deployed SHA가 요청한 develop SHA와 일치하는지 확인한다.

### Phase 2: Production smoke 및 결과 기록 (운영 검증 단위)

- 의존성: Phase 1
- 변경 대상: GitHub Actions run summary (코드 파일 변경 없음)
- 선례: `apps/web-e2e/tests/production-smoke.spec.ts`, `apps/web-e2e/tests/announcements.spec.ts`, `apps/web-e2e/tests/real-price-status.spec.ts`
- 구현:
  - Phase 1 workflow의 `smoke` job이 production alias를 대상으로 `/`, `/subscription`, `/real-price`, `/announcements`, `/favicon.ico` 계약을 실행하게 둔다.
  - `/favicon.ico`가 HTTP 200, icon content type, 비어 있지 않은 body로 통과하는지 확인한다.
  - 실행 URL, expected/deployed SHA, smoke conclusion을 workflow summary에서 보존한다. 실패하면 #122/#128/#158을 재구현하지 말고 실패한 계약과 실제 deployed SHA만 근거로 후속 이슈를 만든다.
- 테스트:
  - `Production smoke and UI regression` job 성공.
  - 운영 SHA가 develop HEAD(또는 그 이후)가 아니거나 favicon smoke가 실패하면 이슈를 닫지 않는다.

## 테스트 계획

1. secret 등록 뒤 최신 develop SHA를 명시한 수동 workflow 실행이 recovery job을 통과하는지 확인한다.
2. summary에서 expected/deployed SHA와 production URL을 확인한다.
3. smoke job에서 favicon 200 및 기존 production UI 계약이 모두 통과하는지 확인한다.

## 자체 검토

- 구현 파일 누락: 없음. 현재 실패는 secret 누락이며 workflow·smoke는 develop에 병합돼 있다.
- phase 분리: 인증/배포 복구와 smoke 검증을 분리했다.
- 범위: #122/#128/#158 기능 재구현, MR Ready/merge/auto-merge는 제외한다.
