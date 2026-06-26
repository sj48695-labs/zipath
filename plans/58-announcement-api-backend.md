## Plan #58 공고 API 연동을 백엔드로 이전

- 플랜식별자: `C559174F`
- 출처: GitHub Issue #58 (Parent #53, Phase 1 - Task 1.1)

### 지시사항 (원본 보존)

> ## 설명
> 현재 프론트에서 직접 호출하는 공공분양 API를 NestJS 백엔드로 이전합니다.
>
> ## 작업 내용
> - AnnouncementService에 LH공사 API 호출 로직 구현
> - AnnouncementController 엔드포인트 추가
>
> ## 변경 파일
> - `apps/api/src/announcement/announcement.service.ts`
> - `apps/api/src/announcement/announcement.controller.ts`

### 결정 사항 (Q&A)

**핵심 발견: 이슈 #58의 작업은 이미 `develop`에 전부 구현되어 있다.**

이 이슈는 부모 이슈 #53의 Phase 1 초기 작업으로 생성되었으나, 이후 다른 PR들
(특히 #82 "맞춤 알림 기능", #96 XML 파싱 유틸)이 먼저 머지되면서 해당 범위가
이미 `develop`에 반영되었다. `58-announcement-api-backend` 브랜치는 그 `develop`
에서 분기(`38d5dfa chore: #58 브랜치 초기화`)되었으므로 작업 대상이 이미 완료 상태다.

구현 현황 검증 결과:

| 이슈 요구사항 | 현재 상태 | 위치 |
|--------------|----------|------|
| AnnouncementService에 LH/data.go.kr API 호출 | ✅ 구현됨 (`syncFromApi`) | `apps/api/src/announcement/announcement.service.ts:91-194` |
| AnnouncementController 엔드포인트 | ✅ 구현됨 (5개 라우트) | `apps/api/src/announcement/announcement.controller.ts` |
| 프론트 직접 호출 제거 | ✅ 백엔드 프록시로 전환 완료 | `apps/web/src/app/api/announcements/route.ts` |
| 모듈 등록 | ✅ `app.module.ts`에 등록됨 | `apps/api/src/app.module.ts` |
| 테스트 | ✅ 유닛 + e2e 존재 | `apps/api/test/announcement.service.spec.ts`, `apps/api/test/e2e/announcement.e2e-spec.ts` |

- API 엔드포인트: `https://apis.data.go.kr/B552555/lttotPblancList/getAPTLttotPblancList`
- API 키: `DATA_GO_KR_API_KEY` (ConfigService, `env.validation.ts`에서 required)
- HTTP: 네이티브 `fetch()` + `fast-xml-parser` (real-price 모듈과 동일 패턴)
- 프론트엔드(`apps/web/src/app/api/announcements/`)는 `NEXT_PUBLIC_API_URL`로
  백엔드에 프록시하며, data.go.kr 직접 호출 코드는 존재하지 않음 (grep 확인 완료)

**결론**: 신규 구현 작업 없음. 본 플랜은 "이미 완료된 이슈"임을 확인하고
회귀 검증 후 이슈를 종료하는 것을 목표로 한다.

### 구현 단계 (Phase)

1. [x] Phase 1: 구현 완료 상태 회귀 검증 — `npm test -w @zipath/api` 184/184 통과 (announcement 23/23 포함), `turbo lint` 5/5·`turbo build` 3/3 통과 확인. 코드 변경 없음, 커밋 없음. (주의: `@zipath/db` dist 빌드 누락 시 auth/jwt/notification 스위트가 컴파일 에러로 실패 → `npm run build -w @zipath/db` 선행 필요.)

### 영향 범위

- 코드 변경: **없음** (이슈 범위가 이미 `develop`에 구현됨)
- 검증 대상 파일:
  - `apps/api/src/announcement/announcement.service.ts`
  - `apps/api/src/announcement/announcement.controller.ts`
  - `apps/api/src/announcement/announcement.module.ts`
  - `apps/web/src/app/api/announcements/route.ts`, `[id]/route.ts`

### 테스트 계획

- `npm test -w @zipath/api` — 기존 `announcement.service.spec.ts` 통과 확인 (회귀)
- `npm run test:e2e -w @zipath/api` — `announcement.e2e-spec.ts` 통과 확인 (로컬 DB 필요)
- `npx turbo lint && npx turbo build` — 전체 빌드 무결성 확인

### 후속 조치 (플랜 외 권장)

이슈 #58은 코드상 이미 충족되었으므로, 신규 PR 없이 이슈를 종료(close)하는 것을
권장한다. 사용자 확인 후 `gh issue close 58 --comment "develop에 이미 구현됨 (PR #82 등에서 반영). 회귀 검증 완료."` 처리.
