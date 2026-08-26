import { expect, test } from "@playwright/test";

test("운영 홈은 핵심 안내를 렌더링한다", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBeLessThan(400);
  await expect(
    page.getByRole("heading", { name: /내 집으로 가는 길,\s*Zipath/ }),
  ).toBeVisible();
});

test("운영 환경은 favicon을 제공한다", async ({ request }) => {
  const response = await request.get("/favicon.ico");
  const contentType = response.headers()["content-type"] ?? "";

  expect(response.status()).toBe(200);
  expect(contentType).toMatch(/image\/(x-icon|vnd\.microsoft\.icon|icon)/i);
  expect((await response.body()).byteLength).toBeGreaterThan(0);
});
