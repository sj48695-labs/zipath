## Plan #64 월별 가격 추이 차트

- 플랜식별자: `657F06AD`
- 출처: GitHub Issue #64 `feat(web): 월별 가격 추이 차트` (Parent #55, Phase 3 - Task 3.1)

### 지시사항 (원본 보존)

> ## Phase 3 - Task 3.1
> Parent: #55
>
> ## 설명
> Chart.js 또는 Recharts로 실거래가 월별 시계열 차트를 구현합니다.
>
> ## 변경 파일
> - `apps/web/app/real-price/components/PriceChart.tsx`

PM 구현 지침:
> #64: 월별 가격 추이 차트. apps/web 실거래가 페이지에 월별 집계 차트 추가, 프로젝트 기존 차트 라이브러리 우선 재사용. 데이터 없는 월 null 처리 필수.

### 결정 사항 (Q&A)

- **Q: 차트 라이브러리는?**
  A: Recharts. `apps/web/package.json`에 `recharts ^3.8.0` 이미 설치됨 + 페이지에서 이미 사용 중. PM 지침("기존 차트 라이브러리 우선 재사용") 준수. Chart.js 도입 안 함.

- **Q: 차트/페이지 UI는 이미 구현되어 있는데?**
  A: 맞다. 커밋 `b68e7d5 feat: 월별 가격 추이 차트 구현 (#20)`에서 차트 컴포넌트(`MonthlyPriceTrendChart.tsx`), 페이지 뷰모드 탭(테이블/차트/월별 추이), trend API route, 백엔드 `searchRange`가 이미 구현됨. #64의 핵심 미완 요구사항은 **PM이 명시한 "데이터 없는 월 null 처리"**.

- **Q: 현재 null 처리가 왜 문제인가?**
  A: 백엔드 `real-price.service.ts`의 `searchRange`가 거래 없는 월에 `avgPrice/minPrice/maxPrice = 0`을 반환한다. 차트는 이 0을 실제 값으로 그려서 0원으로 급락하는 잘못된 라인을 표시한다. 데이터 없는 월은 `null`이어야 차트에 gap(빈 구간)으로 표시된다.

- **Q: 파일 경로 불일치 (issue: `app/real-price/components/PriceChart.tsx`)?**
  A: 실제 프로젝트 구조는 `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`. 기존 파일을 재사용/수정한다 (새 PriceChart.tsx 생성 안 함).

- **Q: 타입 변경 영향은?**
  A: `MonthlyPriceSummary`의 `avgPrice/minPrice/maxPrice`를 `number | null`로 확장. 소비처는 web의 `MonthlyPriceTrendChart.tsx`, `page.tsx`, `compare/page.tsx`. 각 소비처 null 안전성 점검 필요.

### 구현 단계 (Phase)

1. [ ] **Phase 1: 백엔드 — 데이터 없는 월을 null로 집계**
   - 파일:
     - `packages/types/src/index.ts` (`MonthlyPriceSummary`: `avgPrice/minPrice/maxPrice`를 `number | null`로)
     - `apps/api/src/real-price/real-price.service.ts` (`searchRange`: `prices.length === 0`이면 `avg/min/max = null`, `tradeCount = 0` 유지)
     - `apps/api/src/real-price/real-price.service.spec.ts` (신규: `searchRange` 빈 월 null 반환 검증)
   - 구현: 거래가 0건인 월은 `avgPrice/minPrice/maxPrice`를 `null`로 반환. `tradeCount`는 0 유지(차트 보조 표시용).
   - 커밋: `feat(api): #64 월별 추이 집계에서 데이터 없는 월 null 처리`

2. [ ] **Phase 2: 웹 차트 — null 월을 gap으로 렌더링 + 테이블 표기**
   - 파일: `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`
   - 구현:
     - `MonthlyPriceSummary` 로컬 interface를 `number | null`로 맞춤 (또는 `@zipath/types` import).
     - Recharts `<Line>`/`<Area>`에서 `connectNulls={false}` 명시 → null 월은 선이 끊긴 gap으로 표시.
     - `formatPrice`/`tickFormatter`/Tooltip이 `null`을 안전 처리 (null이면 "-" 표시).
     - 하단 요약 테이블: null 값은 "거래 없음"/"-"로 표기.
   - 커밋: `feat(web): #64 데이터 없는 월 차트 gap 및 테이블 표기`

3. [ ] **Phase 3: 웹 소비처 null 안전성 + 법적 고지**
   - 파일:
     - `apps/web/src/app/real-price/page.tsx` (`MonthlyPriceSummaryItem` 로컬 타입 null 반영, trend 결과 처리 점검)
     - `apps/web/src/app/real-price/compare/page.tsx` (월별 추이 소비 시 null 안전성 점검)
     - `MonthlyPriceTrendChart.tsx` 또는 `page.tsx` trend 영역에 "참고용이며 법적 효력 없음" 고지 1줄 추가 (프로젝트 규칙)
   - 구현: 타입 정합성 확보 + null이 산술/렌더에 들어가도 깨지지 않게. 고지 문구 추가.
   - 커밋: `feat(web): #64 추이 소비처 null 안전성 및 법적 고지 추가`

### 영향 범위

- **백엔드**: `RealPriceService.searchRange` 반환값 의미 변경 (0 → null). API JSON 스키마 변경.
- **타입**: `@zipath/types`의 `MonthlyPriceSummary` 필드 nullable화 — 모노레포 전 소비처 영향.
- **웹**: trend 차트 렌더링 동작 변경 (0 급락 → gap). 요약 테이블 표기 변경.
- **무관**: 단일 월 조회(테이블/차트 뷰), scatter/bar 차트는 영향 없음.

### 테스트 계획

- **유닛 (Phase 1)**: `apps/api/src/real-price/real-price.service.spec.ts` 신규.
  - 거래 0건 월 → `avgPrice/minPrice/maxPrice === null`, `tradeCount === 0`.
  - 거래 있는 월 → 기존대로 숫자 집계.
  - `search`를 mock 하여 일부 월만 데이터 있는 시나리오 검증.
  - 실행: `npm test -w @zipath/api`
- **타입/빌드**: `npx turbo build` (types nullable 변경 후 전 패키지 컴파일 통과 확인).
- **린트**: `npx turbo lint`.
- **수동 확인**: 실거래가 페이지 → "월별 추이" 탭 → 거래 없는 월이 포함된 구간 조회 시 차트가 0으로 떨어지지 않고 gap 표시되는지, 테이블에 "거래 없음" 표기되는지 확인.

---

### 검증 (자체 검토)

1. **완전성**: PM 핵심 요구("데이터 없는 월 null 처리 필수") + 기존 차트 재사용 모두 반영. 차트 UI 자체는 #20에서 완료된 상태를 명시하고, #64의 실제 델타(null 처리)에 집중. ✅
2. **Phase 독립성**: P1=백엔드+타입, P2=차트 렌더, P3=소비처+고지. 각 1커밋. 단 타입 nullable화(P1)는 web 컴파일에 영향 → P2/P3에서 흡수하므로 순서 의존성 명시됨. ✅
3. **파일 겹침**: `MonthlyPriceTrendChart.tsx`가 P2(렌더)와 P3(고지)에서 등장 가능 → P3 고지는 `page.tsx` trend 영역에 두어 겹침 회피 권장. 명시함. ✅
4. **테스트 계획**: 신규 spec + build + lint + 수동. 구체적 케이스 명시. ✅
5. **가독성**: Phase 제목만으로 흐름(백엔드 null → 차트 gap → 소비처/고지) 파악 가능. ✅
