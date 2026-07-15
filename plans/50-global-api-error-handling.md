# #50 전역 API 에러 핸들링 및 응답 형식 표준화

- 플랜식별자: `4AC6CF5D`
- 출처: `#50`

## 현재 구조 분석

(Explore 분석 결과)

표준 에러 응답 구조의 **백엔드 구현은 이미 존재**한다. `wip: #50 초기화` 커밋은 빈 커밋이고, 실제 정렬 작업이 남아 있다.

- **표준 envelope 타입**: `apps/api/src/common/interfaces/api-response.interface.ts`
  - `ApiResponse<T> = { success: boolean; data?: T; error?: ApiErrorDetail }`
  - `ApiErrorDetail = { code: string; message: string }`
- **백엔드 필터/인터셉터 (구현됨, main.ts 에 등록됨)**:
  - `apps/api/src/common/http-exception.filter.ts` → `GlobalExceptionFilter` (`@Catch()`)
    - `BadRequestException` → `VALIDATION_ERROR`
    - `HttpException` → `HTTP_<status>`
    - `QueryFailedError` → PG code 별 `DUPLICATE_ENTRY`(23505) / `FOREIGN_KEY_VIOLATION`(23503) / `DATABASE_ERROR`
    - 일반 `Error` → `INTERNAL_ERROR`, 그 외 → `UNKNOWN_ERROR`
  - `apps/api/src/common/interceptors/transform.interceptor.ts` → `TransformInterceptor` (성공 응답을 `{success:true, data}` 로 래핑)
  - **테스트 없음** (`apps/api/src/common` 에 spec 파일 부재)
- **웹 API 클라이언트**: `apps/web/src/lib/api.ts`
  - `fetchApi<T>` 의 `!res.ok` 분기가 **`body.message` 를 직접 읽음** → 표준 envelope 는 메시지가 `body.error.message` 에 있으므로 **현재 에러 메시지가 유실**되고 `API 오류 (status)` fallback 으로만 표시됨.
  - `ApiError` 클래스에 `code` 필드 없음 → 표준 `error.code` 가 버려짐.
  - 소비처: `loan/page.tsx:49`, `subscription/page.tsx:89`, `registry/page.tsx:73` 가 `err instanceof ApiError` → `err.message` 사용.
  - 테스트: `apps/web/src/lib/__tests__/api.test.ts` (legacy `{message}` 형태로 테스트 중).
- **Next.js 프록시 라우트 9개** (모두 `!res.ok`/catch 에서 **비표준** `{ error: string }` 반환):
  - `api/announcements/route.ts`, `api/announcements/[id]/route.ts`
  - `api/real-price/route.ts`, `api/real-price/trend/route.ts`
  - `api/registry/route.ts`, `api/contract-analysis/route.ts`, `api/notifications/route.ts`
  - `api/auth/profile/route.ts`, `api/auth/profile/interest-regions/route.ts`
  - 모두 `unwrapBackendData` 로 성공 응답은 푸나, 에러 응답은 표준 envelope 로 통일돼 있지 않음.

## 변경 파일

- `apps/api/src/common/http-exception.filter.spec.ts` (신규)
- `apps/api/src/common/interceptors/transform.interceptor.spec.ts` (신규)
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/__tests__/api.test.ts`
- `apps/web/src/app/api/announcements/route.ts`
- `apps/web/src/app/api/announcements/[id]/route.ts`
- `apps/web/src/app/api/real-price/route.ts`
- `apps/web/src/app/api/real-price/trend/route.ts`
- `apps/web/src/app/api/registry/route.ts`
- `apps/web/src/app/api/contract-analysis/route.ts`
- `apps/web/src/app/api/notifications/route.ts`
- `apps/web/src/app/api/auth/profile/route.ts`
- `apps/web/src/app/api/auth/profile/interest-regions/route.ts`

## Phase별 구현 계획

### Phase 1 (완료): 백엔드 표준 envelope 단위 테스트 (커밋 단위)

이미 존재하는 필터/인터셉터의 표준 출력 형식을 테스트로 고정한다. (구현 변경 없음, 테스트로 버그 발견 시에만 최소 수정.)

- 변경 파일:
  - `apps/api/src/common/http-exception.filter.spec.ts` (신규)
  - `apps/api/src/common/interceptors/transform.interceptor.spec.ts` (신규)
- 구현:
  - 선례: `apps/api/src/cleanup/cleanup.service.spec.ts` 의 jest 기반 스타일. 단, 여기선 `Test.createTestingModule` 불필요 — 필터/인터셉터를 직접 `new` 해서 테스트.
  - 필터 spec: `GlobalExceptionFilter` 를 `new` 하고, `host` 는 `ArgumentsHost` mock(`switchToHttp().getResponse()` → `{ status: jest.fn().mockReturnThis(), json: jest.fn() }`)으로 구성. 각 분기 호출 후 `response.status`/`response.json` 인자를 검증:
    - `new BadRequestException({ message: ["a", "b"] })` → status 400, body `{ success:false, error:{ code:"VALIDATION_ERROR", message:"a, b" } }`
    - `new NotFoundException("없음")` → status 404, `code:"HTTP_404"`, `message:"없음"`
    - `QueryFailedError` mock (`driverError.code = "23505"`) → status 409, `code:"DUPLICATE_ENTRY"`; `"23503"` → 400, `FOREIGN_KEY_VIOLATION`; 기타 → 500, `DATABASE_ERROR`
    - 일반 `new Error("boom")` → 500, `INTERNAL_ERROR`
    - 비-Error 값(`"oops"`) → 500, `UNKNOWN_ERROR`
    - `QueryFailedError` 는 `import { QueryFailedError } from "typeorm"` 후 `new QueryFailedError("q", [], Object.assign(new Error("x"), { code: "23505" }))` 형태로 생성.
  - 인터셉터 spec: `TransformInterceptor` 를 `new` 하고 `next.handle()` → `of({ value: 1 })` (rxjs `of`). `intercept(ctx, next)` 결과를 구독해 `{ success:true, data:{ value:1 } }` 검증.
- 테스트: `npm test -w @zipath/api` 통과.

### Phase 2 (완료): 웹 fetchApi 에러 파싱 표준 envelope 정렬 + ApiError.code (커밋 단위)

- 변경 파일:
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/lib/__tests__/api.test.ts`
- 구현 (`api.ts`):
  - `ApiError` 에 `code?: string` 추가: 생성자에 3번째 선택 인자 `code?` 추가하고 `public readonly code?: string` 로 보관 (`name`/`status` 패턴 미러).
  - 표준 에러 envelope 로컬 타입 정의:
    `interface ApiErrorEnvelope { success?: boolean; error?: { code?: string; message?: string } }`
  - `parseErrorBody(body: unknown, status: number): { message: string; code?: string }` 헬퍼 추가:
    1. `body.error.message` (표준 envelope) 우선
    2. legacy fallback: `body.message`(string) → `body.error`(string, 프록시 라우트의 `{error:string}`)
    3. 최종 fallback: `API 오류 (${status})`
    - code 는 `body.error.code` 있으면 채움.
  - `fetchApi` 의 `!res.ok` 분기를 `parseErrorBody` 사용으로 교체, `throw new ApiError(message, res.status, code)`.
  - **프록시 라우트 공용 헬퍼도 이 phase 에서 함께 추가** (api.ts 를 어차피 수정하므로 여기로 모음 — P3/P4 는 소비만):
    - `export async function backendErrorResponse(res: Response): Promise<{ status: number; body: ApiResponse }>` — 백엔드 에러 응답 body 를 읽어 표준 `{ success:false, error:{ code, message } }` 로 정규화. body 파싱 실패 시 `{ code:"HTTP_<status>", message:"백엔드 오류 (status)" }`. (내부에서 `parseErrorBody` 재사용.)
    - `export function proxyErrorBody(message: string): ApiResponse` — catch(네트워크 실패)용. `{ success:false, error:{ code:"PROXY_ERROR", message } }` 반환.
    - 헬퍼 자체엔 web `ApiResponse` 로컬 타입이 필요 → `interface ApiResponse<T=unknown> { success:boolean; data?:T; error?:{ code:string; message:string } }` 를 api.ts 에 정의(백엔드 패키지 import 불가하므로 로컬 미러).
- 구현 (`api.test.ts`):
  - 기존 "응답이 ok 가 아니면..." 테스트 유지 (legacy `{message}` fallback 검증).
  - 신규 테스트 추가: `{ success:false, error:{ code:"VALIDATION_ERROR", message:"잘못된 요청" } }` 응답 → `rejects.toMatchObject({ status:400, message:"잘못된 요청", code:"VALIDATION_ERROR" })`.
  - 신규: error 정보 없는 비표준 body(`{}`) → `message:"API 오류 (500)"` fallback 검증.
- 테스트: `npm test -w @zipath/web` (또는 vitest/jest 설정에 맞게) 통과.

### Phase 3: 프록시 라우트 에러 응답 표준 envelope 통일 — 그룹 A (커밋 단위)

- 의존성: Phase 2 (`backendErrorResponse` / `proxyErrorBody` 헬퍼 — 이 phase 는 import 해서 소비만, api.ts 수정 없음)
- 변경 라우트 (각 `!res.ok` 분기의 `{ error: string }` → 표준 envelope, catch 분기도 표준화):
  - `apps/web/src/app/api/announcements/route.ts`
  - `apps/web/src/app/api/announcements/[id]/route.ts`
  - `apps/web/src/app/api/real-price/route.ts`
  - `apps/web/src/app/api/real-price/trend/route.ts`
  - `apps/web/src/app/api/registry/route.ts`
- 패턴 (선례 미러 대상 = 위 announcements/route.ts 구조, `import { backendErrorResponse, proxyErrorBody } from "@/lib/api"`):
  - `if (!res.ok) { const { status, body } = await backendErrorResponse(res); return NextResponse.json(body, { status }); }`
  - `catch { return NextResponse.json(proxyErrorBody("..."), { status:500 }); }`
- 테스트: 라우트는 단위 테스트 부재 → `npx turbo build` 로 타입/빌드 통과 확인. 수동 검증은 테스트 계획 참고.

### Phase 4: 프록시 라우트 에러 응답 표준 envelope 통일 — 그룹 B (커밋 단위)

- 의존성: Phase 3 (`backendErrorResponse` 헬퍼)
- 변경 라우트 (Phase 3 과 동일 패턴 적용):
  - `apps/web/src/app/api/contract-analysis/route.ts`
  - `apps/web/src/app/api/notifications/route.ts`
  - `apps/web/src/app/api/auth/profile/route.ts`
  - `apps/web/src/app/api/auth/profile/interest-regions/route.ts`
- 구현: Phase 3 의 `backendErrorResponse` / catch 패턴 그대로 적용. 각 라우트의 GET/POST/PUT/PATCH 등 메서드별 에러 분기 모두 통일.
- 테스트: `npx turbo build` 통과.

## 테스트 계획

1. `npm test -w @zipath/api` — Phase 1 필터/인터셉터 spec 통과 (표준 envelope 형식 고정).
2. 웹 클라이언트 테스트(`api.test.ts`) — Phase 2 표준 envelope 파싱 + legacy fallback + `code` 전달 검증.
3. `npx turbo build` — Phase 3/4 프록시 라우트 타입/빌드 통과.
4. `npx turbo lint` — 전체 린트 통과.
5. (수동) 백엔드 에러 발생 시 `loan/subscription/registry` 페이지에서 표준 메시지가 노출되는지 확인 (이전엔 `API 오류 (status)` 로 유실되던 메시지).
