## Plan #95 payment·registry·checklist 서비스 단위 테스트 추가

- 플랜식별자: `3D021491`
- 출처: GitHub Issue #95 (https://github.com/sj48695-labs/zipath/issues/95)

### 지시사항 (원본 보존)

아래 3개 서비스에 테스트가 없습니다. 다른 서비스(`cleanup.service.spec.ts`, `loan.service.spec.ts`)에 이미 mock repository 패턴이 확립되어 있으므로 동일 패턴으로 추가합니다.

**미커버 서비스:**
- `payment.service.ts` — Toss 결제 생성/조회/취소 흐름
- `registry.service.ts` — 등기부등본 분석 로직
- `checklist.service.ts` — 체크리스트 CRUD

**완료 조건 (AC):**
- [ ] `apps/api/src/payment/payment.service.spec.ts` 작성 — 결제 생성 성공·실패, 취소 흐름 커버
- [ ] `apps/api/src/registry/registry.service.spec.ts` 작성 — 핵심 분석 메서드 커버
- [ ] `apps/api/src/checklist/checklist.service.spec.ts` 작성 — 템플릿 조회·항목 생성·삭제 커버
- [ ] `npm test -w @zipath/api` 전체 통과
- [ ] 새로 추가한 스펙 파일만으로 각 서비스 주요 분기 커버

### 결정 사항 (Q&A)

- **참고 패턴**: 이슈가 `loan.service.spec.ts`를 언급하나 실제로는 존재하지 않음. 현재 유일한 기존 스펙은 `cleanup.service.spec.ts`이며, 이 파일의 `MockRepository` / `getRepositoryToken` 패턴을 그대로 따른다.
- **payment 외부 의존성**: `PaymentService`는 `ConfigService`(TOSS 키)와 전역 `fetch`를 사용. 테스트에서는 `ConfigService`를 mock provider로 주입하고, `fetch`는 `global.fetch = jest.fn()`으로 스텁한다. `TOSS_SECRET_KEY`를 미설정(undefined)으로 두면 외부 호출 경로를 건너뛰므로, fetch 분기는 키가 있을 때만 별도 검증한다.
- **registry는 순수 로직**: repository·외부 의존성 없음. `analyze()`는 주소 해시 기반 결정적(deterministic) 결과이므로, 특정 주소 입력에 대한 출력 구조·필드·disclaimer를 검증한다. `analysisDate`는 `new Date()` 사용이라 값 단언은 하지 않고 형식만 확인.
- **checklist CRUD 범위**: 실제 서비스 메서드는 `onModuleInit`(시드 삽입), `getByType`(조회+fallback) 두 개뿐. 이슈의 "항목 생성·삭제"는 `onModuleInit`의 템플릿/항목 생성 흐름과 `getByType`의 조회/fallback/NotFound 분기로 커버한다(별도 delete API 없음).
- **AC의 "loan.service.spec.ts" 참조**: 존재하지 않으므로 신규 생성하지 않음. 범위는 payment·registry·checklist 3개 스펙으로 한정.

### 구현 단계 (Phase)

1. [ ] **Phase 1: payment.service 단위 테스트** — `apps/api/src/payment/payment.service.spec.ts` 신규 작성.
   - mock `paymentRepo`(create/save/findOne/find) + mock `ConfigService` 주입, `global.fetch` 스텁.
   - 커버: `getProducts`(상품 목록 반환), `createPayment`(존재 상품 → orderId/amount/clientKey 반환·save 호출 / 미존재 상품 → throw), `confirmPayment`(정상 confirmed / 결제 없음 throw / 금액 불일치 → status=failed throw / TOSS_SECRET_KEY 존재 시 fetch 실패 → failed throw), `getUserPayments`(confirmed 필터), `hasActiveProduct`(건당 true / premium-monthly 30일 만료 분기 / 결제 없음 false).
   - 커밋: `test(api): #95 payment.service 단위 테스트 추가`

2. [ ] **Phase 2: registry.service 단위 테스트** — `apps/api/src/registry/registry.service.spec.ts` 신규 작성.
   - 의존성 없음 → `new RegistryService()` 또는 TestingModule로 인스턴스화.
   - 커버: `analyze(address)`(반환 구조 — address/overallRisk/gap/eul/warnings/tips/disclaimer 필드 존재, overallRisk가 `safe|caution|danger` 중 하나, disclaimer 문구 포함, danger 항목 존재 시 overallRisk=danger 검증 — 해시상 위험 항목이 나오는 주소 케이스 선정), `getTermExplanations`(갑구·을구·근저당권 등 용어 배열 반환).
   - 커밋: `test(api): #95 registry.service 단위 테스트 추가`

3. [ ] **Phase 3: checklist.service 단위 테스트** — `apps/api/src/checklist/checklist.service.spec.ts` 신규 작성.
   - mock `templateRepo`(count/create/save/findOne) + mock `itemRepo`(create/save) 주입.
   - 커버: `onModuleInit`(count=0 → 3개 타입 템플릿+항목 create/save 호출 / count>0 → 시드 스킵 / 예외 발생 시 warn 후 정상 종료), `getByType`(DB 템플릿 존재 → order 정렬·매핑 반환 / DB 조회 실패 → fallback SEED_DATA 반환 / 유효 타입 fallback / 미존재 타입 → NotFoundException).
   - 커밋: `test(api): #95 checklist.service 단위 테스트 추가`

### 영향 범위

- 신규 파일 3개 (테스트 전용), 프로덕션 코드 변경 없음.
  - `apps/api/src/payment/payment.service.spec.ts`
  - `apps/api/src/registry/registry.service.spec.ts`
  - `apps/api/src/checklist/checklist.service.spec.ts`
- 파일 겹침 없음 — Phase별 독립 파일, 독립 리뷰/커밋 가능.

### 테스트 계획

- 실행: `npm test -w @zipath/api`
- 기존 `cleanup.service.spec.ts` 포함 전체 스위트 통과 확인.
- `jest.config.js`의 `collectCoverageFrom: ["src/**/*.service.ts"]`로 3개 서비스 커버리지 상승 확인(선택).
- 외부 네트워크(fetch)는 mock으로 차단되어 실제 호출 없음.
