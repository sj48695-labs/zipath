## Plan #111 공공분양 공고 목록 로딩 상태 및 빈 결과 신뢰도 개선

- 플랜식별자: `E8C95092`
- 출처: GitHub Issue #111 (https://github.com/sj48695-labs/zipath/issues/111)

### 지시사항 (원본 보존)

> 재현/현상: https://zipath-web.vercel.app/announcements 접속 시 `/api/announcements?pageNo=1&numOfRows=10` 호출이 완료되기 전까지(약 수 초) 빈 화면만 표시되고, 완료 후에는 "등록된 공고가 없습니다."만 보임. 실제 청약홈 공고가 있는 시점에도 목록이 채워지는지 검증 불가.
> 기대: ① 데이터 로딩 중에는 스켈레톤 또는 스피너를 보여야 함. ② "등록된 공고가 없습니다."가 표시될 때 마지막 동기화 시각 또는 출처 링크를 함께 보여줘 빈 결과의 신뢰도를 높여야 함.
> 근거: network — `GET /api/announcements?pageNo=1&numOfRows=10` 응답 [200], 본문은 빈 목록. 로딩 중 snapshot에는 heading·paragraph만 존재, 로딩 완료 후 `generic: 등록된 공고가 없습니다.` 추가됨.

### 결정 사항 (Q&A)

- **현재 상태**: `apps/web/src/app/announcements/page.tsx`에 이미 스피너(`loading` 기본값 `true`)가 있으나, 접근성 시맨틱(`role="status"`/레이블)이 없어 a11y 스냅샷에 "로딩 중" 신호가 잡히지 않음 → 스켈레톤 카드로 교체하여 시각/접근성 모두 개선.
- **마지막 동기화 시각 출처**: `Announcement` 엔티티에 `@UpdateDateColumn() updatedAt`이 존재 → 가장 최근 `updatedAt`(MAX)을 `lastSyncedAt`으로 응답에 포함. 데이터가 전혀 없으면 `null`.
- **출처 링크**: 청약홈 공고 페이지(고정 URL)를 빈 상태 신뢰 보강용 출처 링크로 노출. 별도 신규 컬럼/마이그레이션 불필요.
- **응답 스키마 변경**: `findAll` 반환 객체에 `lastSyncedAt: string | null` 추가. 기존 필드(`items/totalCount/page/limit`) 불변 → 하위 호환.
- **법적 고지**: 기존 안내 문구 유지, 빈 상태에 출처 링크/동기화 시각만 보강(법률 해석 X).

### 구현 단계 (Phase)

1. [ ] **Phase 1: 백엔드 — `findAll` 응답에 `lastSyncedAt` 추가 (단위 테스트 우선)**
   - 파일: `apps/api/src/announcement/announcement.service.ts`, `apps/api/test/announcement.service.spec.ts`
   - 구현:
     - `announcement.service.ts`의 `findAll`에서 `MAX(a.updatedAt)`를 조회(데이터 없으면 `null`)해 반환 객체에 `lastSyncedAt`(ISO string 또는 `null`) 추가. DB 비어 자동 동기화 분기에서도 동일 포함.
     - `announcement.service.spec.ts`에 `findAll` 결과가 `lastSyncedAt`를 포함하는지(데이터 있을 때 ISO 문자열, 없을 때 `null`) 검증 케이스 추가.
   - 커밋: `feat(api): #111 공고 목록 응답에 lastSyncedAt 추가`

2. [ ] **Phase 2: 웹 — 로딩 스켈레톤으로 교체 (접근성 시맨틱 포함)**
   - 파일: `apps/web/src/app/announcements/page.tsx`
   - 구현:
     - 기존 무의미 스피너 블록을 카드형 스켈레톤(예: 3~5개 placeholder 카드, `animate-pulse`)으로 교체.
     - 로딩 컨테이너에 `role="status"` + `aria-live="polite"` + `sr-only` "공고를 불러오는 중" 텍스트 추가하여 a11y 스냅샷에 로딩 상태가 노출되도록 함.
   - 커밋: `fix(web): #111 공고 목록 로딩 스켈레톤 및 접근성 상태 노출`

3. [ ] **Phase 3: 웹 — 빈 상태에 마지막 동기화 시각·출처 링크 노출**
   - 파일: `apps/web/src/app/announcements/page.tsx`, `apps/web/src/app/api/announcements/route.ts`
   - 구현:
     - `route.ts`: `unwrapBackendData` 결과를 그대로 전달하므로 `lastSyncedAt`가 자동 통과됨을 확인(별도 변환 불필요, 필요 시 명시적 패스스루).
     - `page.tsx`: `ApiResponse`에 `lastSyncedAt?: string | null` 추가, state로 보관. 빈 상태("등록된 공고가 없습니다.") 블록에 ① `lastSyncedAt`이 있으면 "마지막 동기화: YYYY.MM.DD HH:mm" 표기(없으면 생략 또는 "동기화 정보 없음"), ② 청약홈 출처 링크(`target="_blank" rel="noopener noreferrer"`)를 함께 노출.
     - 날짜 포맷은 기존 `@/lib/dateFormat` 유틸 재사용(필요 시 시각 포함 포맷 보강).
   - 커밋: `fix(web): #111 공고 빈 상태에 동기화 시각·출처 링크 노출`

### 영향 범위

- 백엔드: `AnnouncementService.findAll` 응답 스키마에 `lastSyncedAt` 추가(하위 호환, 기존 필드 불변).
- 웹: `/announcements` 페이지의 로딩 UI 및 빈 상태 UI. Next API 라우트는 패스스루만 확인.
- DB: 스키마/마이그레이션 변경 없음(기존 `updatedAt` 활용).
- 다른 소비자: `/announcements/[id]` 상세 및 매칭 흐름은 변경 없음.

### 테스트 계획

- 단위 테스트: `npm test -w @zipath/api` — `announcement.service.spec.ts`에 `lastSyncedAt` 포함/`null` 케이스 추가, 기존 `findAll` 테스트 통과 유지.
- 린트/빌드: `npx turbo lint`, `npx turbo build` 통과.
- 수동 확인: `/announcements` 접속 시 (a) 로딩 중 스켈레톤+`role=status` 노출, (b) 빈 결과 시 동기화 시각/출처 링크 노출, (c) 데이터 존재 시 기존 목록 정상 렌더.
