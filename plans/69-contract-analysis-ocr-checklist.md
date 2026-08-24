## Plan #69 계약서 분석 기능 (OCR + 체크리스트)

- 플랜식별자: `B8FD7134`
- 출처: GitHub Issue #69 (Parent #57, Phase 5 - Task 5.1)

### 지시사항 (원본 보존)

> ## Phase 5 - Task 5.1
> Parent: #57
>
> ## 설명
> 계약서 이미지를 업로드하면 OCR로 분석하여 주요 조항 체크리스트를 자동 검출합니다.
>
> ## 작업 내용
> - 계약서 이미지 업로드 API
> - OCR 분석 로직
> - 주요 조항 체크리스트 자동 검출
>
> ## 변경 파일
> - `apps/api/src/contract-analysis/`
> - `apps/web/app/contract/`

### 정적 체크리스트 전환 이력 (2026-05-05)

최신 이슈 댓글에 따라 아래 범위가 이 플랜의 기존 OCR 설계와 구현 단계를 대체한다.

- OCR, 계약서 이미지 업로드, 백엔드 분석 API는 MVP에서 구현하지 않는다.
- `/contract`에서 월세·전세·매매 계약 유형을 선택하고 유형별 정적 체크리스트를 제공한다.
- 체크 상태는 계약 유형별로 브라우저 로컬 저장소에 보관한다.
- 체크리스트와 법적 고지 UI만 이슈 #69의 구현 범위로 한다.

### 복구 범위 (2026-08-25)

기존 PR의 구현이 정적 체크리스트 전환 과정에서 제거되어, 이슈 #69의 원래
OCR 분석 범위를 복구한다. 정적 체크리스트·유형별 로컬 저장·법적 고지는 그대로
유지하며, 이미지 업로드, multipart API, OCR 텍스트 조항 분석과 결과 UI를 함께
제공한다.

### 결정 사항 (Q&A)

코드베이스 분석을 통해 도출한 설계 결정 (이슈에 명시되지 않은 부분은 기존 패턴을 따름):

1. **OCR 엔진 선택**
   - 프로젝트는 "전부 무료 공공API" + 무의존성 시뮬레이션 패턴을 지향함 (`RegistryService`가 외부 API 없이 주소 해시 기반 시뮬레이션으로 등기부 분석 결과를 생성하는 것이 대표 사례).
   - 본 플랜도 동일하게 **OCR 결과(추출 텍스트)를 입력으로 받아 분석**하는 구조로 설계한다. 즉 서버는 실제 OCR 엔진을 내장하지 않고, "추출된 계약서 텍스트"를 받아 조항을 검출한다. (실제 OCR은 향후 외부 OCR API/온디바이스 OCR로 교체 가능하도록 경계를 분리.)
   - MVP에서는 업로드된 이미지에 대해 **데모용 시뮬레이션 텍스트**를 생성하거나, 클라이언트가 보유한 텍스트를 함께 전송하는 두 경로를 모두 지원한다. 핵심 가치(조항 검출 + 체크리스트 매칭)는 텍스트 분석 로직에 있다.

2. **이미지 업로드 방식**
   - NestJS `@nestjs/platform-express` 이미 설치됨 → multer 기반 `FileInterceptor` 사용 가능 (별도 패키지 추가 불필요).
   - 업로드 이미지는 영구 저장하지 않음 (Neon 512MB 제약 + R2는 "향후"). 메모리 버퍼로 받아 분석 후 폐기. 파일 크기/타입 검증만 수행.

3. **조항 검출 로직**
   - 기존 `data/checklist-data.ts`의 항목(`ChecklistItemData`)을 재사용. 각 체크리스트 항목에 **검출 키워드**를 매핑하여, OCR 텍스트에서 해당 키워드가 발견되면 "계약서에 명시됨/누락됨"으로 자동 판정.
   - 키워드 매핑 데이터는 `data/clause-keywords.ts`로 신규 추가 (체크리스트 데이터와 분리하여 독립 수정 가능).

4. **프리미엄 결제 게이팅**
   - 계약서 분석은 유료 기능 (`Payment` 엔티티의 `productType = "contract-analysis"`, 990원). `PaymentService.hasActiveProduct(userId, "contract-analysis")`가 이미 존재.
   - 분석 API는 결제 확인을 전제로 하되, **MVP에서는 게이팅을 강제하지 않고 응답에 `isPremium` 안내만 포함** (로그인/결제 흐름은 별도 이슈). 단, 결제 여부를 확인하는 분기는 `userId`가 주어졌을 때만 동작하도록 선택적으로 둔다.

5. **경로 정합성**
   - 이슈는 `apps/web/app/contract/`로 적었으나 실제 구조는 `apps/web/src/app/contract/`. 후자를 사용.
   - 기존 `/contract` 페이지(정적 체크리스트)는 유지하고, OCR 업로드 분석 UI를 같은 페이지에 탭/섹션으로 추가한다.

6. **법적 고지**
   - 분석 응답과 UI 모두에 "참고용이며 법적 효력 없음" `disclaimer` 포함 (`RegistryService` 패턴과 동일).

### 구현 단계 (Phase)

1. [x] **Phase 1 (완료): 조항 키워드 매핑 데이터 추가**
   - 파일: `apps/api/src/contract-analysis/data/clause-keywords.ts` (신규)
   - 구현: 계약 유형별(월세/전세/매매) 주요 조항을 검출하기 위한 키워드 맵 정의. 각 항목은 `{ id, label, keywords: string[], severity: "required" | "recommended" }` 형태. 기존 `checklist-data.ts`의 카테고리(보증금/특약/계약기간/확정일자 등)와 정합되도록 작성. export: `CLAUSE_KEYWORDS: Record<ContractType, ClauseKeyword[]>`.
   - 커밋: `feat(api): #69 계약서 조항 검출 키워드 매핑 데이터 추가`

2. [x] **Phase 2 (완료): OCR 텍스트 분석 서비스 로직 추가**
   - 파일: `apps/api/src/contract-analysis/contract-analysis.service.ts` (기존 수정), `apps/api/src/contract-analysis/contract-analysis.service.spec.ts` (신규)
   - 구현: `analyzeText(type, text)` 메서드 추가. `CLAUSE_KEYWORDS`를 순회하며 텍스트에서 키워드 매칭 → 각 조항을 `{ id, label, detected: boolean, severity, matchedKeywords, advice }`로 판정. 검출/누락 요약(`detectedCount`, `missingRequired`, `riskLevel`)과 `disclaimer` 포함한 결과 반환. 이미지 버퍼 → 텍스트 변환은 `extractText(buffer)` 프라이빗 메서드로 경계 분리(MVP: 데모 시뮬레이션 텍스트 생성, 향후 실 OCR 교체 지점). TDD로 spec 먼저 작성 (월세 텍스트 입력 시 보증금/확정일자 조항 검출, 누락 시 경고 등).
   - 커밋: `feat(api): #69 계약서 OCR 텍스트 조항 검출 분석 로직 구현`

3. [x] **Phase 3 (완료): 이미지 업로드 분석 엔드포인트 추가**
   - 파일: `apps/api/src/contract-analysis/contract-analysis.controller.ts` (기존 수정), `apps/api/src/contract-analysis/dto/analyze-request.dto.ts` (신규)
   - 구현: `POST /contract-analysis/analyze` 추가. `FileInterceptor("image")`(@nestjs/platform-express)로 이미지 수신, multer 메모리 스토리지 + 파일 크기(예: 10MB)·MIME(image/png, image/jpeg) 제한. 이미지가 없고 `text` 필드만 온 경우도 허용(클라이언트 OCR 결과 직접 전송 경로). zod로 `type`(월세/전세/매매) 검증. 결과는 `ContractAnalysisService.analyzeText` 호출. 모듈에 `PaymentModule`/`PaymentService` 주입은 선택적 게이팅용으로 import (결정사항 4: MVP에선 강제 안 함, `isPremium` 안내만).
   - 커밋: `feat(api): #69 계약서 이미지 업로드 분석 엔드포인트 추가`

4. [x] **Phase 4 (완료): 웹 multipart 업로드 헬퍼 추가**
   - 파일: `apps/web/src/lib/api.ts` (기존 수정)
   - 구현: `fetchApi`는 JSON 전용(`Content-Type: application/json` 고정)이라 파일 업로드에 부적합. `fetchApiForm<T>(path, formData, options?)` 헬퍼 추가 — `Content-Type`을 설정하지 않아 브라우저가 multipart boundary 자동 지정, `auth` 옵션 시 Authorization 토큰 부착, 응답은 기존 `unwrapBackendData`로 언랩. 이 Phase에서 `page.tsx`는 건드리지 않음(파일 겹침 방지).
   - 커밋: `feat(web): #69 multipart 폼 업로드용 fetchApiForm 헬퍼 추가`

5. [x] **Phase 5 (완료): 웹 계약서 이미지 분석 UI 추가 + 통합 검증**
   - 파일: `apps/web/src/app/contract/page.tsx` (기존 수정)
   - 구현: 기존 정적 체크리스트 페이지에 "계약서 이미지 분석" 섹션/탭 추가. 계약 유형 선택 → 이미지 파일 선택(`<input type="file" accept="image/*">`) → `fetchApiForm`으로 `POST /contract-analysis/analyze` (multipart/form-data) 호출 → 검출/누락 조항 결과 렌더링(검출=초록, 누락 필수=빨강 경고, 권장=노랑). 분석 중 로딩, 에러 처리, "참고용이며 법적 효력 없음" 고지 표시. 마지막으로 `npx turbo lint`, `npm test -w @zipath/api`, `npx turbo build` 통과 확인.
   - 커밋: `feat(web): #69 계약서 이미지 업로드 분석 UI 추가`

6. [x] **Phase 6 (완료): OCR 업로드 분석 복구 및 회귀 검증**
   - 기존 P1~P5 커밋의 조항 키워드, OCR 텍스트 분석 서비스, multipart 업로드 API와
     웹 분석 UI를 복구한다. 정적 체크리스트의 유형별 로컬 저장과 접근성 개선은 유지한다.
   - 유효 PNG/JPEG, 비이미지·10MB 초과 파일, OCR 분석 실패, 조항 0건 검출을 API
     테스트로 검증한다. UI는 실패 뒤 재시도 가능하고, 체크 상태가 계약 유형별로 복원되도록
     유지한다. 모든 분석 결과와 화면에 “참고용이며 법적 효력 없음” 고지를 표시한다.
   - 커밋: `feat: [P6] #69 OCR 계약서 분석 복구 및 검증`

### 영향 범위

- **API (신규/수정)**
  - `apps/api/src/contract-analysis/data/clause-keywords.ts` (신규)
  - `apps/api/src/contract-analysis/contract-analysis.service.ts` (수정: `analyzeText`/`extractText` 추가)
  - `apps/api/src/contract-analysis/contract-analysis.controller.ts` (수정: `POST /analyze`)
  - `apps/api/src/contract-analysis/contract-analysis.module.ts` (수정 가능: PaymentModule import)
  - `apps/api/src/contract-analysis/dto/analyze-request.dto.ts` (신규)
  - spec 파일들 (신규)
- **Web (수정)**
  - `apps/web/src/lib/api.ts` (Phase 4: `fetchApiForm` multipart 헬퍼)
  - `apps/web/src/app/contract/page.tsx` (Phase 5: 업로드 분석 섹션 추가)
- **무영향**: DB 스키마(이미지 비저장), 마이그레이션, 기존 정적 체크리스트 API(`/checklist`, `/types`, `/summary`)는 그대로 유지.
- **의존성**: 신규 npm 패키지 없음 (`@nestjs/platform-express`의 multer 활용).

### 테스트 계획

- **유닛 (`npm test -w @zipath/api`)**
  - `contract-analysis.service.spec.ts`: 월세/전세/매매 각 유형별 텍스트 입력 → 키워드 검출 정확도, 필수 조항 누락 시 `missingRequired`/`riskLevel` 반영, `disclaimer` 포함 검증, 알 수 없는 type → 예외.
  - (선택) 컨트롤러 spec: 잘못된 type/파일 미첨부+텍스트 미제공 시 400, 정상 multipart 업로드 시 분석 결과 반환.
- **수동/통합**
  - 웹 `/contract` 페이지에서 이미지 업로드 → 검출 결과 렌더링 확인.
  - `npx turbo lint`, `npx turbo build` 통과.
- **회귀**: 기존 정적 체크리스트 플로우(`/contract` 유형 선택 → 체크리스트)와 `/contract-analysis/checklist` API 동작 유지 확인.
