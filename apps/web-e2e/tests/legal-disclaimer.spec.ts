import { test, expect } from "@playwright/test";

test("/loan 화면에 법적 고지가 표시된다", async ({ page }) => {
  const response = await page.goto("/loan");
  expect(response?.status()).toBeLessThan(400);

  await expect(
    page.getByText("참고용이며 법적 효력 없음", { exact: false }),
  ).toBeVisible();
});
