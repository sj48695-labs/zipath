## Plan #61 공고 상세 페이지

- 플랜식별자: `93C633B2`
- 출처: GitHub Issue #61 (https://github.com/sj48695-labs/zipath/issues/61) — Phase 1 / Task 1.4 (Parent: #53)

### 지시사항 (원본 보존)

> ## Phase 1 - Task 1.4
> Parent: #53
>
> ## 설명
> Next.js 공고 상세 페이지를 구현하고, 자격 매칭 결과를 표시합니다.
>
> ## 작업 내용
> - 공고 상세 페이지 UI 구현
> - 자격 매칭 결과 표시 컴포넌트
>
> ## 변경 파일
> - `apps/web/app/announcements/[id]/page.tsx`

부모 이슈 #53 핵심:
- 공공분양 공고 기능 고도화 (API → DB 캐싱 → 자동 매칭 → 상세 페이지)
- Task 1.1~1.3은 이미 완료 (백엔드 `AnnouncementController`, `AnnouncementService`, `Announcement` 엔티티, DB 캐싱, `matchAnnouncement` API 모두 구현 상태).

현재 상태(이슈 시작 시점):
- 커밋 `74735b6 feat(web): 공고 상세 페이지 작업 시작`에서 `apps/web/src/app/announcements/[id]/page.tsx`(`src/` prefix 반영)와 `apps/web/src/app/api/announcements/[id]/route.ts`이 1차 구현된 상태. 동작은 하지만 UX/접근성/구조 측면 다수 보완 필요.

### 결정 사항 (Q&A)

- **Q1. 변경 파일 경로의 `src/` prefix?** → 이슈는 `apps/web/app/announcements/[id]/page.tsx`로 명시되어 있으나, 실제 레포 구조는 `apps/web/src/app/...` 사용 (커밋 `74735b6` 및 다른 페이지 모두 동일). 따라서 본 작업은 `apps/web/src/app/announcements/[id]/page.tsx`를 기준으로 한다.
- **Q2. 백엔드 매칭 API는 손대지 않는가?** → 본 이슈는 Task 1.4(상세 페이지) 한정. 백엔드 매칭 로직(`AnnouncementService.matchAnnouncement`)은 #62(자동 매칭)에서 이미 구현 완료. 다만 프론트가 사용하는 input 의미와 백엔드 기준 단위가 어긋나면(아래 Q4) 사용자가 잘못된 결과를 받으므로 **프론트 라벨/도움말만 정정**한다 (백엔드 코드는 변경 없음).
- **Q3. 자격 매칭 결과 표시 "컴포넌트"의 분리 단위?** → 이슈가 명시적으로 "컴포넌트"를 요구하므로, `MatchResultPanel`(결과 표시)과 `MatchForm`(입력 폼)을 별도 파일로 분리한다. 다른 페이지가 `_components/` 패턴(`apps/web/src/app/real-price/_components/...`)을 쓰고 있으므로 `apps/web/src/app/announcements/[id]/_components/` 디렉터리에 배치. Storybook이나 별도 단위 테스트는 본 PR 범위 외.
- **Q4. "월 소득" vs "연 소득" 단위?** → 백엔드(`subscription.service.ts`, `announcement.service.ts`)의 `income` 임계값(6000/7000만원)은 **연소득 만원** 기준이다. 현재 detail 페이지의 라벨 `"월 소득 (만원)"`은 의미 불일치 버그 → `"연 소득 (만원)"`으로 정정하고 도움말 텍스트(`"세전 가구 합산 연소득"`)를 추가한다. 백엔드는 변경 없음.
- **Q5. 로그인 사용자 입력 자동 채움?** → 부모 #53의 Task 1.3 자동 매칭은 이미 백엔드 매칭 API로 흡수되어 있고, 사용자 프로필 엔티티에는 자격 정보(소득/무주택기간 등)가 저장되어 있지 않다(`User` 엔티티 확인). 따라서 본 PR에서는 **자동 채움 미구현** — 입력 폼만 제공하고, 향후 별도 이슈에서 사용자 프로필 자격 정보 영속화와 함께 다룬다.
- **Q6. 마감(접수 종료)된 공고에서 자격 매칭 폼은?** → 사용자에게 정보 가치는 여전히 있으므로 폼은 노출하되, **헤더에 "이 공고는 마감되었습니다" 안내 배너**를 띄우고 제출 버튼 라벨을 `"참고용 자격 확인"`으로 바꾼다 (제출 자체는 가능).
- **Q7. `rawData` 표시?** → 현재 한국어가 아닌 raw key(`HOUSE_NM`, `RCEPT_BGNDE` 등)를 그대로 노출 중이라 사용자에게 친화적이지 않다. **기본 접힘(collapse)** 처리 후 `<details>`로 감싸서 "원문 데이터 보기" 토글을 제공한다. (key 매핑 테이블은 범위 확장이라 본 PR 외)
- **Q8. 매칭 결과 O/X 마커?** → 이모지 미사용 원칙(글로벌 룰: 사용자가 명시 요청하지 않는 한 이모지 금지). 현재의 알파벳 `O`/`X`는 한국 사용자 컨텍스트에서 통상적이며 색상으로 보강되므로 유지. 단, 스크린리더용으로 `aria-label="자격 충족"`/`"자격 미충족"`을 부여한다.
- **Q9. 에러/로딩/빈 상태 컴포넌트?** → 기존 `apps/web/src/app/announcements/page.tsx`의 인라인 패턴과 동일하게 인라인 스피너 + 에러 박스 유지. 별도 컴포넌트 분리는 over-engineering.
- **Q10. fetchApi 헬퍼 사용?** → 현재 detail 페이지는 Next.js Route Handler(`/api/announcements/[id]`)를 거쳐 백엔드를 호출 중. `subscription/page.tsx`처럼 백엔드를 직접 호출하는 `fetchApi`로 갈아탈 수도 있지만, 목록 페이지(`announcements/page.tsx`)도 Route Handler 경유 패턴이라 **일관성 위해 Route Handler 유지**. (이건 #53 차원의 일관성 결정이고 본 이슈 범위 외)
- **Q11. 테스트?** → web 앱에는 현재 단위/E2E 테스트 셋업이 없음(`apps/web/**/*.spec.tsx` 없음). 본 PR에서 Vitest/Jest 셋업을 새로 도입하는 것은 범위 확장이므로 **테스트는 추가하지 않는다**. 대신 백엔드 매칭 API 호출 계약을 보존하기 위해 `apps/api/test/announcement.service.spec.ts`의 기존 케이스가 모두 통과하는지 확인하고, 필요 시 회귀 테스트 1개만 보강한다(폼 누락 필드 BadRequest 등).
- **Q12. 법적 고지?** → CLAUDE.md 규칙 "참고용이며 법적 효력 없음" 고지 필수. 현재도 매칭 결과 하단에 1줄 표기 중 → 페이지 헤더(공고 카드 하단)에도 동일 고지를 추가해 자격 매칭 외 정보(접수일/지역 등)에도 적용되도록 한다.

### 구현 단계 (Phase)

각 Phase는 1 커밋 = 독립 리뷰 단위.

1. [ ] **Phase 1: 자격 매칭 폼/결과 컴포넌트 분리**
   - 신규 파일:
     - `apps/web/src/app/announcements/[id]/_components/MatchForm.tsx` — `formData` 상태/`onSubmit`을 받아 입력 UI 렌더링. props: `{ value, onChange, onSubmit, loading, disabled?, submitLabel? }`.
     - `apps/web/src/app/announcements/[id]/_components/MatchResultPanel.tsx` — 매칭 결과(`MatchResult`) 표시. props: `{ result, error }`. 빈 상태/에러/성공 분기 처리. 결과 항목별 `aria-label` 부여.
   - 수정 파일:
     - `apps/web/src/app/announcements/[id]/page.tsx` — 분리한 컴포넌트 import, 폼 상태/제출 핸들러는 페이지에 유지 (단일 데이터 소스). 자격 확인 섹션이 ~250줄에서 ~30줄로 축소.
   - 타입: `MatchFormData`, `MatchResult`, `MatchCriterionResult`는 새 파일 `apps/web/src/app/announcements/[id]/_components/types.ts`에 모아 export. 페이지/컴포넌트가 공유.
   - 동작 변경 없음 (리팩토링 only).
   - 커밋: `refactor(web): 공고 상세 자격 매칭 폼/결과 컴포넌트 분리`

2. [ ] **Phase 2: 라벨/단위 정정 + 도움말 추가 + 마감 공고 안내**
   - 수정 파일: `apps/web/src/app/announcements/[id]/_components/MatchForm.tsx`, `apps/web/src/app/announcements/[id]/page.tsx`
   - 구현:
     - `"월 소득 (만원)"` → `"연 소득 (만원)"` 라벨 변경 + helper text `"세전 가구 합산 연소득"` 추가 (Q4)
     - `"무주택 기간 (개월)"` 옆에 helper text `"세대 구성원 전원 기준"` 추가
     - `"부양가족 수"` 옆에 helper text `"본인/배우자 제외, 미성년 자녀 등"`
     - 마감(접수 종료) 공고일 때 페이지 상단에 노란색 안내 배너 + 제출 버튼 라벨 `"참고용 자격 확인"` (Q6)
     - 페이지 상단 공고 카드 하단에 법적 고지 라인 1줄 추가 (Q12)
   - 동작 변경: 사용자가 보는 텍스트만 변경, API 호출/스키마 불변.
   - 커밋: `feat(web): 공고 상세 라벨 명확화 및 마감 공고 안내`

3. [ ] **Phase 3: 접근성/UX 마감 보완 + 원본 데이터 접기**
   - 수정 파일: `apps/web/src/app/announcements/[id]/page.tsx`, `apps/web/src/app/announcements/[id]/_components/MatchResultPanel.tsx`
   - 구현:
     - 결과 항목 `O`/`X` 마커에 `aria-label="자격 충족"`/`"자격 미충족"` (Q8)
     - 에러 메시지 컨테이너에 `role="alert"` `aria-live="polite"`
     - 로딩 스피너에 `role="status"` + 시각장애 사용자용 `<span className="sr-only">로딩 중</span>` (Tailwind sr-only)
     - 원본 데이터 섹션을 `<details>` 토글로 감싸고 기본 접힘, `<summary>원문 데이터 보기</summary>` (Q7)
     - 입력 `name` 속성과 `<label htmlFor>` id 매칭 검증 (`age`/`income`/`homelessMonths`/`dependents`/`region`)
     - "공고 목록으로" 링크에 `aria-label="공고 목록 페이지로 돌아가기"`
   - 커밋: `feat(web): 공고 상세 접근성 개선 및 원본 데이터 토글`

4. [ ] **Phase 4: 회귀 안전망(백엔드 계약 점검)**
   - 수정 파일: `apps/api/test/announcement.service.spec.ts` (필요 시 1~2개 케이스 보강)
   - 구현:
     - 프론트가 `dependents`, `isMarried`, `isFirstHome`, `region`을 옵셔널로 보낼 때 백엔드 `matchRequestSchema`가 정상 파싱하는지 확인하는 케이스 추가 (이미 zod schema는 `.optional()` 처리되어 있음 — 회귀 가드 차원의 명시적 단위 테스트).
     - 폼이 `region: ""` 빈 문자열이 아닌 `undefined`를 보내도록 페이지 코드(이미 `body.region = formData.region.trim()` 분기 처리됨)와 백엔드 동작 일치 확인.
   - 변경 없음이 확인되면 본 Phase는 스킵 가능 (커밋 누락 허용).
   - 커밋(있다면): `test(api): 공고 매칭 요청 스키마 옵셔널 필드 회귀 테스트`

### 영향 범위

- **프론트**: `apps/web/src/app/announcements/[id]/page.tsx` 및 신규 `_components/{MatchForm,MatchResultPanel,types}.tsx` (신규 디렉터리). 기존 import 경로 변경 없음.
- **백엔드**: 변경 없음 (Phase 4가 추가되더라도 테스트 파일만 수정).
- **DB / 마이그레이션**: 변경 없음.
- **API 계약**: 변경 없음 (`GET/POST /api/announcements/:id` 스키마 동일).
- **다른 페이지**: 영향 없음. 목록 페이지(`announcements/page.tsx`)는 변경하지 않음.

### 테스트 계획

- **수동 테스트** (필수, web 앱 단위 테스트 셋업 부재로 인해):
  1. `npm run dev` 후 `/announcements` 진입 → 임의 공고 클릭 → 상세 페이지 로딩 확인
  2. 폼 입력 (나이 30 / 연소득 5000 / 무주택 36) 후 자격 확인 → 결과 패널 정상 렌더링
  3. 폼 미입력 제출 → 클라이언트 NaN 가드 메시지 노출
  4. 빈 region 옵션 + isMarried=true 시나리오 → 신혼부부 결과 포함 확인
  5. 마감된 공고(`endDate < today`) 진입 → 노란 안내 배너 + 제출 버튼 라벨 변경 확인
  6. `rawData` 토글 동작 확인 (기본 접힘 → 클릭 시 펼침)
  7. 키보드 네비게이션(Tab) 및 스크린리더 라벨 확인
  8. 잘못된 ID(`/announcements/99999`) 진입 → 백엔드 404 → 프론트 에러 박스 노출
- **백엔드 회귀**: `npm test -w @zipath/api` 통과 확인 (`announcement.service.spec.ts` 기존 케이스 + Phase 4 추가 케이스).
- **린트/타입**: `npx turbo lint`, `npx turbo build` 모두 통과 (TypeScript strict + `any` 금지 규칙 준수).
- **CI**: PR 생성 시 lint + build + unit + E2E 자동 실행. `auto-merge` 라벨은 본 PR에서 미부착(상세 페이지 UI 변경이라 리뷰 권장).
