import { expect, test, type Page } from "@playwright/test";

function monthSelect(page: Page) {
  return page.locator("label", { hasText: "계약월" }).locator("xpath=following-sibling::select");
}

async function openSearch(page: Page): Promise<void> {
  await page.goto("/real-price");
  await expect(monthSelect(page)).toHaveValue(/^\d{6}$/);
  await expect(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
}

const trade = {
  aptNm: "검증아파트", dealAmount: "120,000", buildYear: "2010",
  dealYear: "2026", dealMonth: "8", dealDay: "12", excluUseAr: "84.9",
  floor: "7", umdNm: "역삼동", jibun: "123", roadNm: "테헤란로",
};

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });

    for (const outcome of ["success", "empty"] as const) {
      test(`실거래가 loading → ${outcome}`, async ({ page }, testInfo) => {
        let releaseResponse!: () => void;
        const held = new Promise<void>((resolve) => { releaseResponse = resolve; });
        await page.route("**/api/real-price?*", async (route) => {
          await held;
          await route.fulfill({ json: { trades: outcome === "success" ? [trade] : [] } });
        });
        await openSearch(page);
        await page.getByRole("button", { name: "조회", exact: true }).click();
        try {
          await expect(page.getByRole("button", { name: "조회 중...", exact: true })).toBeDisabled();
          await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");
          await expect(page.getByRole("status")).toContainText("실거래가를 조회하고 있어요");
          await testInfo.attach("loading", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        } finally {
          releaseResponse();
        }
        if (outcome === "success") {
          await expect(page.getByRole("table")).toContainText(trade.aptNm);
          await expect(page.getByText("총 1건 (최대 50건 표시)")).toBeVisible();
          await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);
        } else {
          const empty = page.getByText("검색 결과가 없습니다");
          await empty.scrollIntoViewIfNeeded();
          await expect(empty).toBeInViewport();
          await expect(page.getByText("다른 계약월을 선택해보세요.")).toBeVisible();
          await expect(page.getByText("다른 지역을 선택해 다시 조회해보세요.")).toBeVisible();
          const box = await empty.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
        }
        await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
        await expect(page.getByRole("status")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
        await testInfo.attach(outcome, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      });
    }

    test("HTTP 오류 후 입력을 바꿔도 동일 조건으로 재시도해 거래를 표시한다", async ({ page }, testInfo) => {
      const requests: string[] = [];
      let releaseResponse!: () => void;
      const held = new Promise<void>((resolve) => { releaseResponse = resolve; });
      await page.route("**/api/real-price?*", async (route) => {
        requests.push(route.request().url());
        if (requests.length === 1) {
          await held;
          await route.fulfill({ status: 500, json: { error: "일시적인 오류" } });
        } else {
          await route.fulfill({ json: { trades: [trade] } });
        }
      });
      await openSearch(page);
      await page.getByRole("button", { name: "조회", exact: true }).click();
      try {
        await expect(page.getByRole("button", { name: "조회 중...", exact: true })).toBeDisabled();
        await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");
      } finally {
        releaseResponse();
      }
      const alert = page.locator("main").getByRole("alert");
      await expect(alert).toContainText("실거래가 조회에 실패했어요");
      await expect(page.getByRole("status")).toHaveCount(0);
      await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
      const retry = alert.getByRole("button", { name: "다시 시도" });
      await retry.scrollIntoViewIfNeeded();
      await expect(retry).toBeInViewport();
      const box = await alert.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      await testInfo.attach("error", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      await page.locator("label", { hasText: "지역" }).locator("xpath=following-sibling::select").selectOption({ index: 1 });
      await monthSelect(page).selectOption({ index: 1 });
      // Tab from the preceding search button verifies keyboard reachability.
      await page.getByRole("button", { name: "조회", exact: true }).focus();
      await page.keyboard.press("Tab");
      // Area filters precede retry, so walk the actual tab order rather than focusing retry directly.
      for (let step = 0; step < 20 && !(await retry.evaluate((el) => el === document.activeElement)); step++) {
        await page.keyboard.press("Tab");
      }
      await expect(retry).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("table")).toContainText(trade.aptNm);
      expect(requests).toHaveLength(2);
      expect(requests[1]).toBe(requests[0]);
      await expect(alert).toHaveCount(0);
      await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
      await testInfo.attach("retry-success", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    });
  });
}
