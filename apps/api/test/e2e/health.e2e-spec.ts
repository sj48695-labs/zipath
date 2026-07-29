import { HealthController } from "@/health/health.controller";

describe("HealthController (e2e)", () => {
  const controller = new HealthController();

  it("GET /api/health → 200 { status: 'ok' }", () => {
    expect(controller.check()).toEqual({ status: "ok" });
  });
});
