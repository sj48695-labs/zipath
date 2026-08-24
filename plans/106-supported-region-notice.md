# #106 실거래가 지원 지역 안내 마무리

- 플랜식별자: `60572EF9`
- 출처: `#106`, PM 구현 지침 및 현재 브랜치의 미병합 커밋

## 현재 구조 분석

- 현재 브랜치는 깨끗하며, `fd718c9 docs: #106 plan 작성`과 `1e9cab6 test(web): [P1] #106 지원 지역 고지 초기 노출 검증`이 `develop` 위에 미병합으로 남아 있다. 기존 plan은 P1 커밋에서 정상적으로 삭제되었으므로, 이 문서는 재계획을 위한 현황 기록이다.
- `apps/web/src/app/real-price/_lib/regions.ts`의 `REGIONS`는 서울 전체와 경기·인천·부산 일부 시·구만 포함한다. `SUPPORTED_REGION_LABEL`은 공유 고지 문구에 쓰인다.
- `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx`는 `banner`와 `inline` 변형을 제공한다. `/real-price/page.tsx`는 검색 컨트롤 전 banner를, `/real-price/compare/page.tsx`는 지역 선택 카드의 첫 요소로 inline 고지를 렌더한다. 두 페이지의 선택지는 같은 `REGIONS`를 사용한다.
- `apps/web-e2e/tests/real-price-hydration.spec.ts`는 두 경로를 첫 진입해 각 고지 문구, 법적 고지, 계약월 초기화 및 hydration 오류 부재를 검증한다. `apps/web-e2e/tests/real-price-compare.spec.ts`는 비교 화면의 독립 초기 렌더와 검색 입력을 검증한다.

## 변경 파일

- `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx` (기존 보존 변경)
- `apps/web-e2e/tests/real-price-hydration.spec.ts` (기존 보존 변경)
- `apps/web-e2e/tests/real-price-compare.spec.ts` (기존 보존 변경)

## Phase별 구현 계획

### Phase 1 (완료): 지원 지역 고지의 초기 노출 E2E 검증 (커밋 단위)

- 완료 커밋: `1e9cab6 test(web): [P1] #106 지원 지역 고지 초기 노출 검증`
- 변경 파일:
  - `apps/web/src/app/real-price/_components/SupportedRegionNotice.tsx`
  - `apps/web-e2e/tests/real-price-hydration.spec.ts`
  - `apps/web-e2e/tests/real-price-compare.spec.ts`
- 구현:
  - `real-price-hydration.spec.ts`의 `routes` 루프에서 `/real-price` banner의 `서울·경기·인천·부산의 일부 지역으로 제한`과 `/real-price/compare` inline의 `아래 목록에서만 선택`을 경로별로 확인한다.
  - `real-price-compare.spec.ts`의 `loads with key elements`에서 비교 화면의 inline 고지 본문을 초기 렌더 시점에 확인한다.
  - `SupportedRegionNotice`의 `banner`/`inline` API와 `SUPPORTED_REGION_LABEL` import를 유지하며, 양 페이지가 공유하는 `REGIONS`와 선택 로직은 변경하지 않는다.
- 선례:
  - 두 페이지 공통 최초 진입 검증은 `apps/web-e2e/tests/real-price-hydration.spec.ts`의 `for (const { path, heading } of routes)`를 따른다.
  - 비교 화면의 독립 화면 검증은 `apps/web-e2e/tests/real-price-compare.spec.ts`의 `loads with key elements`를 따른다.
- 테스트:
  - `npm test -w @zipath/web-e2e -- real-price-hydration.spec.ts real-price-compare.spec.ts`
  - 필요 시 `npm test -w @zipath/web-e2e`

## 테스트 계획

1. `/real-price` 첫 진입에서 `수도권·부산` 지원 범위와 서울·경기·인천·부산 일부 제한 설명을 확인한다.
2. `/real-price/compare` 첫 진입에서 지역 선택 카드의 지원 범위와 선택 목록 제한 설명을 확인한다.
3. 두 경로에서 기존 법적 고지, 계약월 클라이언트 초기화 및 hydration 오류 부재를 함께 확인한다.

## 자체 검토

- 요구된 두 최초 진입 경로, 공유 `SupportedRegionNotice`, `REGIONS` 유지, 초기 노출 E2E가 모두 반영되어 누락 파일이 없다.
- 기능 구현과 회귀 검증은 이미 단일 P1 커밋으로 끝나 있어, 별도 P0 추출이나 후속 구현 phase는 필요하지 않다.
