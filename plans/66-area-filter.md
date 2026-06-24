## Plan #66 실거래가 평형별 필터링

- 플랜식별자: `1805D240`
- 출처: GitHub Issue #66 (Phase 3 - Task 3.3, parent: #55), PR #84

### 지시사항 (원본 보존)

> ## Phase 3 - Task 3.3
> Parent: #55
>
> ## 설명
> 전용면적 기준 필터링 기능을 추가합니다.
>
> ## 변경 파일
> - `apps/api/src/real-price/real-price.service.ts`
> - `apps/web/app/real-price/components/AreaFilter.tsx`

### 결정 사항 (Q&A)

| 질문 | 결정 |
|------|------|
| 필터링 위치 (서버 vs 클라이언트) | **서버 측** 필터링. `RealPriceService.search()` 가 `minArea`/`maxArea` 옵션을 받아 캐시된 trade 배열에서 필터링 후 반환. 클라이언트는 단순 UI 전달자. 캐시는 필터링되지 않은 원본 그대로 저장(재사용성 확보). |
| 평형 단위 | **㎡(전용면적)** 단위. `RealPriceTrade.excluUseAr` (data.go.kr 원본 필드) 기준 `parseFloat` 후 `min ≤ area ≤ max` 비교. 평(坪) 환산은 UI 라벨에만 노출하지 않고 ㎡ 그대로 표기. |
| 프리셋 구간 | 부동산 시장 통례에 따라 4구간 + 직접입력: 소형(~60㎡), 중형(60~85㎡, 국민주택규모), 대형(85~135㎡), 초대형(135㎡~). `apps/web/src/app/real-price/_components/AreaFilter.tsx` PRESETS 상수에 정의. |
| 입력 검증 | 컨트롤러 `searchSchema` 에서 zod `z.coerce.number().min(0).optional()` 로 음수 차단. min/max 대소관계는 미검증 (역전 시 결과 0건으로 자연 처리). |
| 캐시 키 | 평형 필터를 **캐시 키에 포함하지 않음**. `(regionCode, dealType, yearMonth)` 만 키로 사용 → 한 번 캐싱된 월간 데이터를 다양한 평형 필터로 재활용. `totalCount` 는 필터링 후 건수 기준 반환. |
| 캐시 응답 형식 | `{ trades, totalCount, cached, regionCode, yearMonth }` — `cached: true` 라도 필터링 후 결과 반환. |
| 트렌드(`searchRange`)에서의 필터 | 본 이슈 범위 밖. `searchRange()` 는 `search()` 를 내부 호출하지만 minArea/maxArea 미전달 → 트렌드는 항상 전체 평형 평균. (UI 도 트렌드 탭에서 `AreaFilter` 숨김 처리) |
| 프론트 라우팅 | 기존 `/api/real-price` Next.js route handler 에 `minArea`/`maxArea` 쿼리 추가 전달. 백엔드 API 는 `regionCode`/`yearMonth`/`minArea`/`maxArea` 쿼리로 호출. |
| 컴포넌트 위치 | 기존 컨벤션(`_components` 폴더)을 따라 `apps/web/src/app/real-price/_components/AreaFilter.tsx` 신규 (이슈 본문 경로 `apps/web/app/real-price/components/` 는 `_components` 로 보정). |
| 테스트 전략 | 서비스 단위 테스트는 기존 spec 에 통합(필터링 케이스 추가 검증). 컨트롤러 e2e 는 zod 검증 케이스 추가. AreaFilter 컴포넌트는 web 테스트 인프라 미구축이라 수동 검증. |

### 구현 단계 (Phase)

1. [x] **Phase 1: 백엔드 `search()` 에 평형 필터 인자 추가 + 컨트롤러 zod 스키마 확장**
   - 파일:
     - `apps/api/src/real-price/real-price.service.ts` (수정 — `search(regionCode, yearMonth, minArea?, maxArea?)` 시그니처 확장, `filterByArea(trades, min, max)` private 헬퍼 추가, 캐시 hit/miss 양쪽 분기에서 필터 적용 후 `{ trades: filtered, totalCount: filtered.length, cached, ... }` 반환)
     - `apps/api/src/real-price/real-price.controller.ts` (수정 — `searchSchema` 에 `minArea/maxArea` `z.coerce.number().min(0).optional()` 추가, `@Get("search")` 핸들러에서 쿼리 파싱 후 service 호출)
     - `apps/api/test/real-price.service.spec.ts` (수정 — 캐시 hit + 필터 적용 케이스, 캐시 miss + 필터 적용 케이스, min/max 미지정 시 전체 반환 케이스 추가)
     - `apps/api/test/e2e/real-price.e2e-spec.ts` (수정 — `minArea` 음수 → 400, 정상 범위 → 200 + 필터링된 trades 반환 케이스)
   - 구현: `filterByArea` 는 `parseFloat(excluUseAr)` 후 NaN 차단, `minArea !== undefined && area < minArea` / `maxArea !== undefined && area > maxArea` 조건 검사. 필터 미지정 시 원본 trades 그대로 반환(early return).
   - 검증: `npm test -w @zipath/api` 그린, `npm run test:e2e -w @zipath/api` 그린.
   - 커밋: `feat(api): #66 [P1] 실거래가 평형별 필터링 (minArea/maxArea)`

2. [x] **Phase 2: 프론트 `AreaFilter` 컴포넌트 + Next.js route handler 쿼리 전달**
   - 파일:
     - `apps/web/src/app/real-price/_components/AreaFilter.tsx` (신규 — 프리셋 5종(전체/소형/중형/대형/초대형) + 직접 입력(min/max 숫자 + 적용 버튼), `onFilterChange({ min?, max? })` 콜백, Enter 키 적용 지원)
     - `apps/web/src/app/real-price/page.tsx` (수정 — `areaFilter` state 추가, `<AreaFilter onFilterChange={setAreaFilter} />` 마운트(trend 탭 제외), `handleSearch` 에서 `params.set("minArea"/"maxArea")` 전달, table/chart 양 뷰모드 모두 필터 결과 표시)
     - `apps/web/src/app/api/real-price/route.ts` (수정 — `LAWD_CD`/`DEAL_YMD` 외 `minArea`/`maxArea` 쿼리도 백엔드 `/real-price/search` 로 전달)
   - 구현: AreaFilter 는 `"use client"` + `useState`/`useCallback`. 프리셋 클릭 시 즉시 콜백, 직접 입력은 적용 버튼/Enter 로 명시 트리거. 트렌드 탭에서는 `viewMode !== "trend"` 조건으로 숨김.
   - 검증: `npx turbo lint` 그린, `npx turbo build` 그린, Vercel 프리뷰 빌드 성공.
   - 커밋: `feat(web): #66 [P2] 실거래가 평형별 필터 UI (프리셋 + 직접 입력)`

### 영향 범위

- **백엔드 API**: `GET /api/real-price/search` 에 `minArea?`/`maxArea?` 쿼리 옵션 추가 (옵셔널, 기존 호출자 무영향).
- **DB**: 변경 없음. 캐시 키는 그대로 `(regionCode, dealType, yearMonth)`.
- **프론트**: `/real-price` 페이지에 평형 필터 UI 추가 (테이블/차트 뷰에만, 트렌드 뷰는 미적용).
- **공공API 호출**: 변경 없음 (캐시 hit 시에도 필터링만 클라이언트단에서 수행하므로 추가 호출 없음).
- **테스트**: `real-price.service.spec.ts` + `real-price.e2e-spec.ts` 에 필터링 케이스 추가.

### 테스트 계획

| 레벨 | 시나리오 |
|------|----------|
| 서비스 유닛 | (a) min/max 미지정 → 전체 trade 반환 (b) min=60, max=85 → 해당 범위 trade 만 반환 (c) min 만 지정 → ≥min trade 반환 (d) max 만 지정 → ≤max trade 반환 (e) `excluUseAr` 파싱 실패(NaN) → 해당 row 제외 (f) 캐시 hit + 필터 → cached=true + 필터링 결과 |
| 컨트롤러 e2e | (a) `?minArea=-1` → 400 (b) `?minArea=60&maxArea=85` → 200 + 필터링된 trades (c) 필터 미지정 호출 → 기존 동작과 동일 |
| 수동 (UI) | 프리셋 전환 시 즉시 결과 갱신 / 직접 입력 + Enter 적용 / 트렌드 탭 전환 시 필터 숨김 확인 / 차트 뷰(법정동 평균 + 면적 산점도)가 필터링된 데이터 기준으로 다시 집계되는지 확인 |
| CI 검증 | `Lint / Build / Test` 워크플로우 그린 (PR #84 에서 모두 SUCCESS 확인) |
