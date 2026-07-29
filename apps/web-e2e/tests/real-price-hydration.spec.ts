import { expect, test, type Page } from "@playwright/test";

const HYDRATION_PATTERNS = [
  /hydration/i,
  /Text content does not match server-rendered HTML/i,
  /There was an error while hydrating/i,
  /Minified React error #418/i,
  /Minified React error #423/i,
  /Minified React error #425/i,
];

function isHydrationMessage(message: string): boolean {
  return HYDRATION_PATTERNS.some((pattern) => pattern.test(message));
}

function collectHydrationIssues(page: Page): string[] {
  const issues: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    const text = message.text();
    if (isHydrationMessage(text)) {
      issues.push(text);
    }
  });

  page.on("pageerror", (error) => {
    if (isHydrationMessage(error.message)) {
      issues.push(error.message);
    }
  });

  return issues;
}

for (const path of ["/real-price", "/real-price/compare"] as const) {
  test(`${path} has no hydration warnings and shows the legal disclaimer`, async ({
    page,
  }) => {
    const issues = collectHydrationIssues(page);
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    if (path === "/real-price") {
      await expect(page.getByRole("heading", { name: "실거래가 조회" })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "지역 간 비교" })).toBeVisible();
    }

    await expect(
      page.getByText("참고용이며 법적 효력 없음", { exact: false }).first(),
    ).toBeVisible();

    await page.waitForTimeout(500);
    await expect(page.getByLabel("계약월")).not.toHaveValue("");
    expect(issues).toEqual([]);
  });
}
