# #157 develop SHA와 Vercel 운영 배포 자동 복구 및 웹 회귀 계약

- 플랜식별자: `05E3D7B2`
- 출처: `#157`

## 현재 구조 분석

- GitHub Actions의 [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)는 `develop` push에서 lint/build/API 테스트와 Render 배포만 수행한다. `apps/web-e2e` 실행은 PR의 `run-e2e-web` 라벨 또는 수동 실행에 한정되어 있고, 기본 URL은 `https://zipath-web.vercel.app`이다.
- Vercel 설정은 [`vercel.json`](../vercel.json)의 기본 설정뿐이며, 현재 저장소에는 Vercel 배포의 Git SHA를 조회·대조하거나 불일치를 복구하는 자동화가 없다.
- Playwright 설정은 [`apps/web-e2e/playwright.config.ts`](../apps/web-e2e/playwright.config.ts)의 `ZIPATH_BASE_URL`을 통해 운영 사이트를 대상으로 할 수 있다. 기존 [`health.spec.ts`](../apps/web-e2e/tests/health.spec.ts)는 홈 화면 HTTP/제목만 확인한다.
- 공고 상태 UI는 [`apps/web/src/app/announcements/page.tsx`](../apps/web/src/app/announcements/page.tsx)의 loading/error/빈 결과 분기와 [`apps/web-e2e/tests/announcements.spec.ts`](../apps/web-e2e/tests/announcements.spec.ts)의 route mock 계약으로 이미 상당 부분 검증한다.
- 실거래가 상태 UI는 [`apps/web/src/app/real-price/page.tsx`](../apps/web/src/app/real-price/page.tsx)의 loading/error/빈 결과 분기와 [`real-price-error.ts`](../apps/web/src/app/real-price/real-price-error.ts)의 오류 문구 모델이 있으나, Playwright 상태 전이 계약은 없다. [`real-price-hydration.spec.ts`](../apps/web-e2e/tests/real-price-hydration.spec.ts)은 서버 초기 상태와 하이드레이션만 확인한다.
- favicon 원본은 [`apps/web/src/app/favicon.ico`](../apps/web/src/app/favicon.ico)에 존재하지만, 운영 URL이 이를 HTTP 200으로 제공하는 회귀 테스트는 없다.
- 회의록으로 지정된 `/tmp/pm-meeting-PVgJlx`는 계획 수립 시점에 존재하지 않아 열람할 수 없었다. 이 계획은 이슈 본문의 요구사항과 현 저장소 구조를 기준으로 한다.

## 변경 파일

- `.github/workflows/production-web-regression.yml` (신규)
- `apps/web-e2e/tests/production-smoke.spec.ts` (신규)
- `apps/web-e2e/tests/announcements.spec.ts`
- `apps/web-e2e/tests/real-price-status.spec.ts` (신규)

## Phase별 구현 계획

### Phase 1 (완료): 운영 Vercel 배포 SHA 대조·복구 워크플로 (커밋 단위)

- 변경 파일: `.github/workflows/production-web-regression.yml` (신규)
- 구현:
  - `develop` push 및 `workflow_dispatch`에서 실행되는 별도 workflow를 추가한다. CI 자체 성공 후에 실행되도록 `workflow_run`으로 연결하지 않고, 해당 커밋의 `github.sha`를 기준으로 명확히 동작하게 한다.
  - `actions/github-script` 또는 `curl`에서 Vercel REST API를 호출해 `target=production`인 최신 배포의 `meta.githubCommitSha`를 조회하고, `github.sha`와 동일한지 step output에 기록한다. 조회 실패·예상 필드 누락·실패 상태는 성공으로 간주하지 않는다.
  - SHA가 불일치하면 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secret을 사용해 해당 `github.sha`를 ref로 하는 production 배포를 생성하고, deployment가 `READY`가 될 때까지 제한된 polling으로 대기한다. `ERROR`/`CANCELED`/timeout은 workflow 실패로 처리한다.
  - 일치한 경우에는 재배포하지 않고, 검증 대상 URL 및 일치 SHA를 job summary에 남긴다. 불일치 복구 후에는 복구된 deployment URL(커스텀 도메인 `https://zipath-web.vercel.app`)을 다음 smoke job의 `ZIPATH_BASE_URL`로 전달한다.
  - recovery API 계약은 Vercel Git 연결 프로젝트의 Git source deployment(`repoId`, `ref=github.sha`, `target=production`)를 사용한다. 필요한 repository ID/secret 이름은 workflow 상단 주석과 `workflow_dispatch` 입력 설명에 명시한다.
- 테스트:
  - workflow YAML의 `on.push.branches`, SHA 비교 조건, 불일치 때만 create/poll하는 조건, 실패 상태 처리, secret 참조 및 smoke job 의존성을 정적 검토한다.
  - GitHub Actions의 수동 실행에서 일치/불일치 각각을 확인한다. (Vercel secret이 필요한 통합 검증)

### Phase 2: 운영 홈·favicon smoke 계약 추가 (커밋 단위)

- 변경 파일: `apps/web-e2e/tests/production-smoke.spec.ts` (신규)
- 구현:
  - `health.spec.ts`의 `page.goto('/')` HTTP 상태·title 선례를 따라, 운영 base URL에서 홈이 4xx/5xx 없이 로드되고 핵심 heading 또는 navigation이 렌더되는 smoke test를 만든다.
  - Playwright `request` fixture로 `/favicon.ico`를 요청해 HTTP 200, `image/x-icon` 또는 브라우저가 반환하는 유효 favicon content type, 비어 있지 않은 response body를 확인한다. `apps/web/src/app/favicon.ico`가 실제 운영 asset으로 제공되는 계약으로 고정한다.
  - 테스트는 live backend 상태에 의존하지 않도록 정적 shell과 favicon만 확인하며, URL은 기존 `ZIPATH_BASE_URL` 설정을 그대로 사용한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- production-smoke.spec.ts`
  - Phase 1의 smoke job에서 같은 파일을 운영 URL로 실행한다.

### Phase 3: 공고·실거래가 상태 UI E2E 계약 보강 (커밋 단위)

- 의존성: Phase 2 (운영 smoke 실행 기반)
- 변경 파일: `apps/web-e2e/tests/announcements.spec.ts`, `apps/web-e2e/tests/real-price-status.spec.ts` (신규)
- 구현:
  - `announcements.spec.ts`의 기존 route mock과 `page.route()`/retry 검증 선례를 유지해 loading, API error, 전체 빈 상태, 지역 필터 빈 상태가 서로 배타적으로 보여야 한다는 운영 번들 회귀 계약을 정리·보강한다. 이미 검증된 문구는 중복하지 않고 상태별 핵심 `role=status`/`role=alert`와 복구 행동을 명시한다.
  - `real-price-status.spec.ts`에서 `/api/real-price`를 mock해 [`real-price/page.tsx`](../apps/web/src/app/real-price/page.tsx)의 조회 버튼 흐름을 실행한다. 지연 응답일 때 `role=status`의 조회/콜드스타트 안내, 5xx 응답일 때 `real-price-error.ts`의 오류 제목·재시도 버튼, 빈 거래 배열일 때 검색 결과 없음·다음 행동 안내를 각각 고정한다.
  - 각 테스트는 실제 운영 API가 아니라 브라우저에서 제공되는 배포 번들(UI 코드)을 검증하도록 mock을 사용한다. 따라서 외부 공공 API/Render 콜드스타트로 인한 flaky failure 없이 운영 배포의 상태 UI 회귀를 검출한다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- announcements.spec.ts real-price-status.spec.ts`
  - `npm test -w @zipath/web-e2e`
  - Phase 1 smoke job에서 전체 Playwright suite를 `ZIPATH_BASE_URL=https://zipath-web.vercel.app`로 실행한다.

## 테스트 계획

1. workflow YAML에서 `develop` SHA 조회 → 최신 Vercel production deployment SHA 비교 → 불일치 때 정확한 SHA로 재배포 → READY 대기 → 실패 전파 순서를 확인한다.
2. 수동 workflow 실행으로 deployment SHA가 같을 때 재배포하지 않는 경우와 다를 때 한 번만 복구한 뒤 smoke가 실행되는 경우를 검증한다.
3. Playwright로 홈 렌더와 `/favicon.ico` 제공을 운영 URL에서 확인한다.
4. route mock 기반 E2E로 공고의 loading/error/empty/filtered-empty 상태와 실거래가의 loading/error/empty 상태 및 재시도 UI를 확인한다.
5. 전체 웹 E2E를 운영 URL 대상으로 실행해 public-home·announcements·real-price 회귀 계약이 함께 통과하는지 확인한다.
