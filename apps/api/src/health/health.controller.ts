import { Controller, Get } from "@nestjs/common";

// Render 헬스체크 호환을 위해 prefix 미적용 경로(`/`, `/health`)와
// 일반 API 경로(`/api/health`) 모두 응답해야 함. main.ts 에서 global prefix
// `/api` 의 exclude 로 처리되므로 컨트롤러는 두 경로(`/`, `/health`) 모두
// 등록한다.
@Controller()
export class HealthController {
  @Get()
  root() {
    return { status: "ok" };
  }

  @Get("health")
  check() {
    return { status: "ok" };
  }
}
