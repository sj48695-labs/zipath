import { expect, test } from "@playwright/test";

const trade = (aptNm: string) => ({
  aptNm, dealAmount: "120,000", buildYear: "2010", dealYear: "2026",
  dealMonth: "8", dealDay: "12", excluUseAr: "84.9", floor: "7",
  umdNm: "역삼동", jibun: "123", roadNm: "테헤란로",
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });
    for (const retryFirst of [false, true]) {
      test(`45초 timeout 뒤 늦은 응답은 ${retryFirst ? "재시도 결과" : "timeout 안내"}를 바꾸지 않는다`, async ({ page }, testInfo) => {
        const requests: string[] = [];
        const failures: { url: string; error: string | null }[] = [];
        page.on("requestfailed", (request) => {
          if (new URL(request.url()).pathname === "/api/real-price") {
            failures.push({ url: request.url(), error: request.failure()?.errorText ?? null });
          }
        });
        let release!: () => void;
        let finished!: () => void;
        const held = new Promise<void>((resolve) => { release = resolve; });
        const released = new Promise<void>((resolve) => { finished = resolve; });
        await page.route("**/api/real-price?*", async (route) => {
          requests.push(route.request().url());
          if (requests.length === 1) {
            await held;
            try {
              await route.fulfill({ json: { trades: [trade("늦은응답아파트")] } });
            } finally {
              finished();
            }
          } else {
            await route.fulfill({ json: { trades: [trade("재시도아파트")] } });
          }
        });
        await page.goto("/real-price");
        await expect(page.locator("label", { hasText: "계약월" }).locator("xpath=following-sibling::select")).toHaveValue(/^\d{6}$/);
        await page.getByRole("button", { name: "동의", exact: true }).click();
        const clockTime = new Date("2026-11-11T00:00:00Z");
        await page.clock.install({ time: clockTime });
        await page.clock.pauseAt(new Date(clockTime.getTime() + 1_000));
        await page.getByRole("button", { name: "조회", exact: true }).click();
        try {
          await expect.poll(() => requests.length).toBe(1);
          await page.clock.runFor(10_000);
          await expect(page.getByRole("status")).toContainText("서버가 준비 중입니다");
          await page.clock.runFor(34_999);
          await expect(page.getByRole("button", { name: "조회 중...", exact: true })).toBeDisabled();
          await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
          await page.clock.runFor(1);
          const alert = page.locator("main").getByRole("alert");
          await expect(alert).toContainText("서버 준비 중이에요");
          await expect(page.getByRole("status")).toHaveCount(0);
          await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
          await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);
          const retry = alert.getByRole("button", { name: "다시 시도" });
          await retry.scrollIntoViewIfNeeded();
          await expect(retry).toBeInViewport();
          await expect(retry).toBeEnabled();
          const box = await alert.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
          await testInfo.attach("timeout", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
          await expect.poll(() => failures.length).toBe(1);
          expect(failures[0].error).toMatch(/ABORTED|CANCELLED/i);
          if (retryFirst) {
            await retry.click();
            await expect(page.getByRole("table")).toContainText("재시도아파트");
            expect(requests).toHaveLength(2);
            expect(requests[1]).toBe(requests[0]);
          }
          release();
          await released;
          // Drain browser tasks after releasing the intercepted, already aborted request.
          await page.clock.runFor(100);
          await expect(page.getByText("늦은응답아파트")).toHaveCount(0);
          if (retryFirst) {
            await expect(page.getByRole("table")).toContainText("재시도아파트");
            await expect(alert).toHaveCount(0);
          } else {
            await expect(alert).toContainText("서버 준비 중이에요");
            await expect(retry).toBeEnabled();
          }
          await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
          await testInfo.attach("late-response", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        } finally {
          release();
          await testInfo.attach("requests", { body: JSON.stringify({ requests, failures }, null, 2), contentType: "application/json" });
        }
      });
    }
  });
}
