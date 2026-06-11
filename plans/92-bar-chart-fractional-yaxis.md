# #92 거래 건수 바 차트 Y축 소수 눈금 제거

## 목표
- `apps/web`의 거래 건수 바 차트에서 Y축 소수 눈금이 표시되지 않도록 한다.
- Recharts `YAxis`에 `allowDecimals={false}`를 적용하거나, 필요 시 정수만 표시하는 `tickFormatter`를 적용한다.

## 범위
- 대상 파일: `apps/web/src/app/real-price/compare/page.tsx`
- 확인 대상:
  - `지역별 거래 건수` 바 차트
  - `dataKey="tradeCount"`를 사용하는 `Bar`
  - 해당 차트의 `YAxis`

## 현재 코드 확인 결과
- `apps/web/src/app/real-price/compare/page.tsx`의 `지역별 거래 건수` 차트 `YAxis`에는 이미 `allowDecimals={false}`가 적용되어 있다.
- `apps/web/src/app/real-price/_components/MonthlyPriceTrendChart.tsx`에는 `tradeCount` 데이터가 있지만 현재 차트 시리즈로 렌더링되지는 않고 표/툴팁 문구에만 남아 있다.
- 다른 `apps/web` 내 거래 건수 바 차트 후보는 발견되지 않았다.

## Phase 구성

### Phase 1: 대상 차트 재확인
- `apps/web`에서 `tradeCount`, `거래 건수`, `BarChart`, `YAxis` 사용처를 재검색한다.
- 실제 렌더링되는 거래 건수 바 차트가 `real-price/compare/page.tsx`인지 확인한다.

### Phase 2: 최소 수정
- `지역별 거래 건수` 차트 `YAxis`에 정수 눈금 보장이 빠져 있으면 `allowDecimals={false}`를 추가한다.
- 이미 적용되어 있으면 코드 변경 없이 현재 구현이 이슈 요구사항을 충족한다고 판단한다.
- Recharts 동작상 추가 방어가 필요하다고 판단될 경우에만 `tickFormatter={(v: number) => Number.isInteger(v) ? String(v) : ""}`를 병행한다.

### Phase 3: 검증
- `npx turbo lint --filter @zipath/web` 또는 사용 가능한 웹 lint 명령을 실행한다.
- 프로젝트 표준 테스트인 `npm test -w @zipath/api`는 웹 UI 단일 변경과 직접 관련은 낮지만 `/plan` 스킬 지침상 필요 시 실행 대상으로 남긴다.

## 커밋 계획
- 변경이 필요한 경우 1개 커밋:
  - `fix(web): #92 거래 건수 차트 Y축 정수 눈금 적용`
- 현재처럼 이미 반영된 상태라면 커밋하지 않는다.
