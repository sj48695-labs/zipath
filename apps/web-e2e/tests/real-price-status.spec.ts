import { expect, test, type Page } from "@playwright/test";

function monthSelect(page: Page) {
  return page
    .locator("label", { hasText: "계약월" })
    .locator("xpath=following-sibling::select");
}

async function openSearch(page: Page): Promise<void> {
  await page.goto("/real-price");
  await expect(monthSelect(page)).toHaveValue(/^\d{6}$/);
}

test("실거래가 조회 중에는 상태 안내를 표시한다", async ({ page }) => {
  let releaseResponse: (() => void) | undefined;
  const responseHeld = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route("**/api/real-price?*", async (route) => {
    await responseHeld;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ trades: [] }),
    });
  });

  await openSearch(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("실거래가를 조회하고 있어요");
  releaseResponse?.();
  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
});

test("실거래가 API 오류는 재시도 행동과 함께 표시한다", async ({ page }) => {
  let shouldSucceed = false;

  await page.route("**/api/real-price?*", async (route) => {
    await route.fulfill({
      status: shouldSucceed ? 200 : 500,
      contentType: "application/json",
      body: JSON.stringify(shouldSucceed ? { trades: [] } : { error: "일시적인 오류" }),
    });
  });

  await openSearch(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText("실거래가 조회에 실패했어요");
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);

  shouldSucceed = true;
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
});

test("실거래가 빈 결과는 다음 검색 행동을 안내한다", async ({ page }) => {
  await page.route("**/api/real-price?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ trades: [] }),
    });
  });

  await openSearch(page);
  await page.getByRole("button", { name: "조회", exact: true }).click();

  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
  await expect(page.getByText("다른 계약월을 선택해보세요.")).toBeVisible();
  await expect(page.getByText("다른 지역을 선택해 다시 조회해보세요.")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
