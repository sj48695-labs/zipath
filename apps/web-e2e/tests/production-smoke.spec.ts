import { expect, test } from "@playwright/test";

const HYDRATION_RE =
  /hydration|Minified React error #(418|423|425)|Text content does not match server-rendered HTML/i;

test("운영 홈은 핵심 안내를 렌더링한다", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBeLessThan(400);
  await expect(
    page.getByRole("heading", { name: /내 집으로 가는 길,\s*Zipath/ }),
  ).toBeVisible();
});

test("운영 홈은 법적 고지와 실거래가 탐색을 제공한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText("법적 고지")).toBeVisible();
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await expect(
    page.locator("#mobile-nav-menu").getByRole("link", { name: "실거래가" }),
  ).toBeVisible();
});

test("운영 청약 화면은 청약통장 필드와 확인 중 상태를 제공한다", async ({
  page,
}) => {
  await page.route("**/subscription/simulate", async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [],
        points: [],
        totalPoints: 0,
        maxPoints: 0,
        message: "ok",
      }),
    });
  });

  const response = await page.goto("/subscription");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByText("청약통장 가입기간")).toBeVisible();

  await page.getByPlaceholder("만 나이").fill("29");
  await page.getByPlaceholder("연소득").fill("4000");
  await page.getByPlaceholder("개월 수").fill("36");
  await page.getByRole("button", { name: "자격 확인하기" }).click();
  await expect(page.getByRole("button", { name: /확인 중/ })).toBeDisabled();
});

test("운영 실거래가 직접 접근 시 hydration console error가 없다", async ({
  page,
}) => {
  const hydration: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && HYDRATION_RE.test(message.text())) {
      hydration.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (HYDRATION_RE.test(error.message)) {
      hydration.push(error.message);
    }
  });

  const response = await page.goto("/real-price");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: "실거래가 조회" })).toBeVisible();
  expect(hydration).toEqual([]);
});

test("운영 환경은 favicon을 제공한다", async ({ request }) => {
  const response = await request.get("/favicon.ico");
  const contentType = response.headers()["content-type"] ?? "";

  expect(response.status()).toBe(200);
  expect(contentType).toMatch(/image\/(x-icon|vnd\.microsoft\.icon|icon)/i);
  expect((await response.body()).byteLength).toBeGreaterThan(0);
});
