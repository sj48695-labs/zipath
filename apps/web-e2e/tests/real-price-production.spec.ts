import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });
    test("실제 실거래가 요청은 결과 또는 복구 가능한 안내로 종료된다", async ({ page, baseURL }, testInfo) => {
      test.setTimeout(150_000);
      expect(baseURL, "실제 운영 URL을 명시해야 한다").toBe("https://zipath-web.vercel.app");
      const events: object[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") events.push({ type: "console", text: message.text() });
      });
      page.on("pageerror", (error) => events.push({ type: "pageerror", text: error.message }));
      page.on("requestfailed", (request) => events.push({ type: "requestfailed", url: request.url(), error: request.failure() }));
      page.on("response", (response) => {
        if (new URL(response.url()).pathname === "/api/real-price") {
          events.push({ type: "response", url: response.url(), status: response.status(), at: new Date().toISOString() });
        }
      });
      const requestUrls: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).pathname === "/api/real-price") {
          requestUrls.push(request.url());
          events.push({ type: "request", url: request.url(), at: new Date().toISOString() });
        }
      });
      try {
        const response = await page.goto("/real-price");
        expect(response?.status()).toBeLessThan(400);
        await expect(page.getByRole("heading", { name: "실거래가 조회", exact: true })).toBeVisible();
        const month = page.locator("label", { hasText: "계약월" }).locator("xpath=following-sibling::select");
        const region = page.locator("label", { hasText: "지역" }).locator("xpath=following-sibling::select");
        await expect(month).toHaveValue(/^\d{6}$/);
        events.push({ type: "conditions", region: await region.inputValue(), month: await month.inputValue() });
        // Keep collecting the actual request even when an older deployment lacks the disclaimer.
        await expect.soft(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
        for (let attempt = 0; attempt < 2; attempt++) {
          const started = Date.now();
          if (attempt === 0) {
            await page.getByRole("button", { name: "조회", exact: true }).click();
          } else {
            const retry = page.locator("main").getByRole("alert").getByRole("button", { name: "다시 시도" });
            await retry.scrollIntoViewIfNeeded();
            await expect(retry).toBeInViewport();
            const box = await retry.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
            await page.getByRole("button", { name: "조회", exact: true }).focus();
            for (let step = 0; step < 20 && !(await retry.evaluate((el) => el === document.activeElement)); step++) {
              await page.keyboard.press("Tab");
            }
            await expect(retry).toBeFocused();
            await page.keyboard.press("Enter");
          }
          await expect.poll(() => requestUrls.length).toBe(attempt + 1);
          await testInfo.attach(`attempt-${attempt + 1}-loading`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
          let outcome = "pending";
          try {
            await expect.poll(async () => {
              if (await page.getByRole("button", { name: "조회 중...", exact: true }).count()) return "pending";
              if (await page.locator("main").getByRole("alert").count()) {
                return (await page.locator("main").getByRole("alert").innerText()).includes("서버 준비 중이에요") ? "timeout" : "error";
              }
              if (await page.getByText("검색 결과가 없습니다").count()) return "empty";
              if (await page.getByRole("table").locator("tbody tr").count()) return "success";
              return "pending";
            }, { timeout: Math.max(1, 48_000 - (Date.now() - started)), intervals: [100, 250, 500] }).not.toBe("pending");
            const alert = page.locator("main").getByRole("alert");
            outcome = await alert.count()
              ? ((await alert.innerText()).includes("서버 준비 중이에요") ? "timeout" : "error")
              : await page.getByText("검색 결과가 없습니다").count() ? "empty" : "success";
            await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
            await expect(page.getByRole("status")).toHaveCount(0);
          } finally {
            events.push({ type: "terminal", attempt: attempt + 1, outcome, elapsedMs: Date.now() - started, at: new Date().toISOString(), searchEnabled: await page.getByRole("button", { name: "조회", exact: true }).isEnabled().catch(() => false) });
            await testInfo.attach(`attempt-${attempt + 1}-terminal`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
          }
          if (attempt === 1) expect(requestUrls[1]).toBe(requestUrls[0]);
          if (outcome === "success" || outcome === "empty") break;
        }
      } finally {
        await testInfo.attach("actual-production-observations", { body: JSON.stringify({ url: baseURL, viewport, events }, null, 2), contentType: "application/json" });
      }
    });
  });
}
