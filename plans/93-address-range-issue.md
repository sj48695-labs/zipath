## Plan #93 지원 지역 범위 미안내 — 수도권·부산 외 지역 검색 불가

- 플랜식별자: `847EE902`
- 출처: GitHub Issue #93 (동일 배치 형제: #91 #92 #94 #95 #96)

### 지시사항 (원본 보존)

> ## 재현/현상
> 지역 목록이 서울 25개구, 경기 일부(수원·성남·고양·화성·파주·용인·김포), 인천, 부산에 한정됨. 대전·광주·대구·울산·세종·강원·충청·전라·경북·경남·제주 등은 검색해도 결과 없음. 지원 범위 안내 없음.
>
> ## 기대
> 지역 선택 패널 상단 또는 툴팁에 지원 지역 범위(예: "수도권·부산 지원")를 명시하거나, 추후 지역 확대 예정 안내가 있어야 함.
>
> ## 근거
> snapshot 초기 로드 시 서울·경기·인천·부산 외 시도 항목 전무. "대전"·"광주" 검색 시 empty state(이슈 #3).

PM 구현 지침:
> #93: 미지원 지역 검색 시 안내 메시지 추가. 지원 지역(수도권, 부산) 상수 정의 → 검색 입력값 비교 → 미지원 시 인라인 경고 표시. 검색 결과 없음 메시지와 문구·스타일 분리.

### 결정 사항 (Q&A)

**Q1. 어느 화면이 대상인가?**
A. 실거래가 기능 2개 화면 모두.
- `apps/web/src/app/real-price/page.tsx` — 지역을 `<select>` 드롭다운으로 선택. 자유 검색이 없어 사용자가 커버리지 한계를 인지할 방법이 전무 → 셀렉트 위에 지원 지역 안내 배너 필요.
- `apps/web/src/app/real-price/compare/page.tsx` — "지역 검색..." 자유 입력(`input`)이 `REGIONS`를 필터(`r.name.includes(query)`)함. "대전"·"광주" 입력 시 `filteredRegions === []`이 되어 **체크박스 그리드가 아무 메시지 없이 빈 채로** 렌더됨 → 이슈가 지목한 정확한 empty state. 여기에 **미지원 지역 인라인 경고**를 추가한다.

**Q2. "지원 지역 범위" 상수는 어떻게 정의하나?**
A. 현재 `REGIONS` 배열이 `page.tsx`와 `compare/page.tsx`에 **중복 정의**되어 있음(동일 시군구 코드/이름). 지원 시도(수도권·부산) 안내 문구는 두 화면이 공유해야 하므로, 신규 공용 모듈 `apps/web/src/app/real-price/_lib/regions.ts`에 다음을 정의:
- `REGIONS` (기존 배열 단일화 — 두 페이지의 중복 제거)
- `SUPPORTED_SIDO`: `["서울", "경기", "인천", "부산"]` (지원 시도 상수)
- `SUPPORTED_REGION_LABEL`: `"수도권·부산"` (안내 문구용)
중복 제거를 같이 처리해 "지역 추가 시 두 곳을 고쳐야 하는" 기존 부채도 해소한다. (PM 지침의 "상수 정의" 충족)

**Q3. 미지원 여부 판정 기준은?**
A. compare 화면에서 사용자가 입력한 `searchQuery`가 비어있지 않고, `filteredRegions.length === 0`이며, 입력값이 **미지원 시도명을 포함**(예: "대전","광주","대구" 등 `SUPPORTED_SIDO`에 없는 시도)할 때 미지원 경고를 띄운다. 단순화를 위해 1차 판정은 "검색 결과 0건 + 입력값이 공백 아님"으로 하되, 문구는 "수도권·부산만 지원" 안내로 통일한다. (지원 시도 오타로 0건인 경우도 동일 안내가 합리적이므로 시도명 화이트리스트 정밀 매칭은 과설계로 보고 제외 — Q&A로 기록.)

**Q4. "검색 결과 없음"과 "미지원 지역" 문구·스타일을 어떻게 분리하나? (PM 핵심 지침)**
A.
- **미지원 지역 경고(신규)**: amber/yellow 계열 인라인 경고 박스(`border-yellow-200 bg-yellow-50 text-yellow-800`). 문구 예: "현재 실거래가 조회는 수도권·부산만 지원합니다. 그 외 지역은 추후 확대 예정이에요." (이슈의 "추후 지역 확대 예정 안내" 반영)
- **검색 결과 없음(기존/일반)**: 중립 회색 톤(`text-muted-foreground`). 메인 페이지의 기존 데이터-empty 문구 "해당 조건의 거래 데이터가 없습니다."는 **거래 데이터 0건**(API 응답 비어있음)이라는 별개 의미이므로 변경하지 않는다. compare 화면에서 지원 지역을 검색했으나 0건인 경우는 단순 회색 안내로 처리. → 두 메시지가 색/문구/의미 모두 분리됨.

**Q5. 메인 `page.tsx`(드롭다운)에는 무엇을 추가하나?**
A. 자유 검색이 없으므로 "검색 입력 비교"는 불가. 대신 지역 `<select>` 위에 **상시 지원 범위 안내 배너**를 1개 추가(이슈 기대치: "패널 상단에 지원 지역 범위 명시"). 동일 amber 스타일·동일 문구 컴포넌트를 재사용해 두 화면 일관성 확보.

**Q6. 안내 배너를 컴포넌트로 뽑나?**
A. 예. 두 화면이 동일 문구·스타일을 쓰므로 `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx` 신규(presentational). 문구·시도 라벨은 `_lib/regions.ts`의 상수에서 가져와 단일 출처 유지.

**Q7. 법적 고지 필요?**
A. 본 이슈는 데이터 해석이 아니라 커버리지 안내 UI이므로 추가 법적 고지 불필요. 기존 실거래가 화면의 출처/면책 문구는 그대로 둔다.

**Q8. 테스트는?**
A. 프로젝트 표준 유닛 테스트는 `@zipath/api` 대상이라 web 컴포넌트 커버 X. 웹은 Playwright e2e 워크스페이스(`@zipath/web-e2e`)가 존재. 다만 e2e는 Vercel preview URL 대상이라 미배포 변경 검증 부적합. 따라서 **순수 판정 로직을 `_lib/regions.ts`에 함수로 분리**(`isUnsupportedRegionQuery(query, filteredCount)`)하고, web 워크스페이스에 경량 단위 테스트를 추가하는 것을 기본으로 한다. (web에 테스트 러너 미설정 시: 로직 함수는 분리하되 테스트는 e2e 시나리오 1건으로 대체하고 그 사실을 PR 본문에 명시 — Phase 4에서 환경 확인 후 확정.)

### 구현 단계 (Phase)

1. [ ] Phase 1: 지원 지역 상수·판정 로직 공용 모듈 분리 — `apps/web/src/app/real-price/_lib/regions.ts` 신규. 기존 `page.tsx`의 `REGIONS` 배열을 이곳으로 이동, `SUPPORTED_SIDO`(`["서울","경기","인천","부산"]`)·`SUPPORTED_REGION_LABEL`(`"수도권·부산"`)·순수 함수 `isUnsupportedRegionQuery(query: string, filteredCount: number): boolean`(query 비공백 && filteredCount===0) 정의. 아직 페이지는 미수정(다음 Phase에서 import 전환). 커밋: `refactor(web): #93 실거래가 지원 지역 상수/판정 로직 공용 모듈 분리`

2. [ ] Phase 2: 지원 지역 안내 컴포넌트 추가 — `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx` 신규. amber 인라인 경고 스타일, 문구는 `_lib/regions.ts` 상수 사용. props로 variant(`banner` 상시 / `inline` 검색결과) 또는 단일 형태로 구현. "추후 확대 예정" 안내 포함. 커밋: `feat(web): #93 지원 지역 안내 컴포넌트 추가`

3. [ ] Phase 3: 메인 실거래가 페이지 적용 — `apps/web/src/app/real-price/page.tsx` 에서 로컬 `REGIONS` 제거하고 `_lib/regions.ts`에서 import, 지역 `<select>` 위에 `SupportedRegionNotice` 배너 1개 렌더. 기존 "해당 조건의 거래 데이터가 없습니다." empty state는 의미·스타일 유지(변경 금지). 커밋: `feat(web): #93 실거래가 조회 화면에 지원 지역 안내 추가`

4. [ ] Phase 4: 지역 비교 페이지 적용 + 미지원 검색 경고 — `apps/web/src/app/real-price/compare/page.tsx` 에서 로컬 `REGIONS` 제거하고 공용 모듈 import, 체크박스 그리드 영역에 `isUnsupportedRegionQuery(searchQuery, filteredRegions.length)` 참이면 `SupportedRegionNotice`(inline) 표시, 지원 지역 검색이지만 0건인 일반 케이스는 회색 "검색 결과가 없습니다" 안내로 분리. web 워크스페이스 테스트 환경 확인 후 `isUnsupportedRegionQuery` 단위 테스트 추가(불가 시 PR 본문에 e2e 대체 명시). 커밋: `feat(web): #93 지역 비교 화면 미지원 지역 검색 경고 추가`

### 영향 범위

- 신규: `apps/web/src/app/real-price/_lib/regions.ts` (REGIONS 단일화 + 지원 시도 상수 + 판정 함수)
- 신규: `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx`
- 수정: `apps/web/src/app/real-price/page.tsx` (로컬 REGIONS 제거 → import, 배너 추가)
- 수정: `apps/web/src/app/real-price/compare/page.tsx` (로컬 REGIONS 제거 → import, 미지원 경고/일반 0건 분리)
- 부수효과: `REGIONS` 중복 정의 제거(두 곳 → 한 곳). 코드 동작 동일(같은 코드/이름 배열). 백엔드·DB·API 라우트 변경 없음.

### 테스트 계획

- 로직 단위: `isUnsupportedRegionQuery`
  - 빈 query → false (검색 안 함)
  - query 있고 filteredCount>0 (예: "서울") → false
  - query 있고 filteredCount===0 (예: "대전","광주") → true
- 린트/빌드: `npx turbo lint`, `npx turbo build` (web 빌드 통과 — REGIONS import 경로/타입 확인)
- 회귀(수동/e2e): 메인 화면 지역 셀렉트 위 배너 노출 / compare 화면에서 "대전" 입력 시 amber 경고, "서울" 입력 시 정상 목록, 미선택 0건은 회색 문구 — 미지원 경고와 검색결과없음 문구·색이 분리되는지 확인
- 표준 유닛(`npm test -w @zipath/api`): 본 변경은 web 전용이라 영향 없음(green 유지 확인)
- Phase 4에서 web 테스트 러너 유무 확정: 있으면 `isUnsupportedRegionQuery` 단위 테스트 추가, 없으면 e2e/수동 검증으로 대체하고 PR 본문에 기록
