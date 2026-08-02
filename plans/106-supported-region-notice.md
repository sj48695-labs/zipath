# #106 실거래가 지원 지역 안내 마무리

- 플랜식별자: `9E6B4D45`
- 출처: `#106`, PM 구현 지침 및 현재 브랜치의 미병합 커밋

## 현재 구조 분석

- 현재 브랜치에는 이미 `e5b9e95`와 `43c465d`로 지원 지역 안내와 E2E 회귀 검증이 반영되어 있다. `714ec04`는 리베이스 전 WIP로서 이력상의 기존 plan 파일만 삭제했으며, 기능 코드는 삭제하지 않았다. 이 미병합 커밋은 유지한다.
- `apps/web/src/app/real-price/_lib/regions.ts`의 `REGIONS`는 서울 전체, 경기·인천·부산 일부 시·구만 포함한다. `SUPPORTED_REGION_LABEL`은 `수도권·부산`으로 공유 문구에 사용된다.
- `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx`는 `banner`와 `inline` 변형을 제공하는 공유 안내 컴포넌트다. banner는 지원 범위와 서울·경기·인천·부산 일부라는 상세를, inline은 선택 목록 제한을 안내한다.
- `apps/web/src/app/real-price/page.tsx`는 조회 탭과 검색 컨트롤 사이에서 banner를, `apps/web/src/app/real-price/compare/page.tsx`는 지역 선택 카드의 첫 요소에서 inline 안내를 렌더한다. 두 페이지의 선택지는 모두 같은 `REGIONS`를 사용한다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts`는 두 최초 진입 경로를 루프로 방문해 제목, 각 안내 문구, 법적 고지, 초기 계약월 select, hydration 오류 부재를 검증한다. `apps/web-e2e/tests/real-price-compare.spec.ts`는 비교 화면의 안내와 검색 입력을 추가로 검증한다.

## 변경 파일

- `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx`
- `apps/web-e2e/tests/real-price-hydration.spec.ts`
- `apps/web-e2e/tests/real-price-compare.spec.ts`

## Phase별 구현 계획

### Phase 1 (완료): 기존 지원 범위 안내의 초기 노출 E2E 검증 (커밋 단위)

- 변경 파일:
  - `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx`
  - `apps/web-e2e/tests/real-price-hydration.spec.ts`
  - `apps/web-e2e/tests/real-price-compare.spec.ts`
- 구현:
  - `real-price-hydration.spec.ts`의 경로별 분기에서 title뿐 아니라 banner의 `서울·경기·인천·부산의 일부 지역으로 제한`과 inline의 `아래 목록에서만 선택` 설명을 각각 기대한다. 이로써 두 최초 진입 화면이 단순한 수도권 약칭이 아닌 정확한 지원 범위를 고지하는지를 검증한다.
  - `real-price-compare.spec.ts`의 `loads with key elements` 테스트에는 비교 카드의 inline 설명이 초기 렌더되는 assertion을 추가한다.
  - `SupportedRegionNotice`는 기존 `SUPPORTED_REGION_LABEL` 단일 import와 `banner`/`inline` API를 유지하고, 두 페이지가 사용하는 `REGIONS` 목록·선택 방식은 변경하지 않는다. 컴포넌트 변경은 이 검증에서 문구 불일치가 발견될 때에만 최소 범위로 한다.
- 선례:
  - 두 경로를 함께 검증하는 `apps/web-e2e/tests/real-price-hydration.spec.ts`의 `for (const path ...)` 루프를 따른다.
  - 비교 화면의 독립 초기 렌더 검증은 `apps/web-e2e/tests/real-price-compare.spec.ts`의 `loads with key elements` 테스트를 따른다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- real-price-hydration.spec.ts real-price-compare.spec.ts`
  - 필요 시 `npm test -w @zipath/web-e2e`로 전체 웹 E2E 회귀를 확인한다.

## 테스트 계획

1. `/real-price` 첫 진입에서 `실거래가 조회는 현재 수도권·부산만 지원합니다.` 및 서울·경기·인천·부산 일부 제한 설명이 보이는지 확인한다.
2. `/real-price/compare` 첫 진입에서 지역 선택 카드 안의 `현재 지원 범위: 수도권·부산`과 선택 범위 안내가 보이는지 확인한다.
3. 두 경로에서 기존 법적 고지, 초기 계약월 선택값, hydration 오류 부재를 함께 확인한다.
