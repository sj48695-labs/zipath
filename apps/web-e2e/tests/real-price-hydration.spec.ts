import { test, expect } from '@playwright/test';

const routes = ['/real-price', '/real-price/compare'] as const;
const hydrationErrorPattern =
  /hydration|did not match|text content does not match|expected server html|minified react error #\d+/i;

for (const route of routes) {
  test(`${route} 에서 hydration 경고가 없다`, async ({ page }) => {
    const hydrationMessages: string[] = [];

    page.on('console', (message) => {
      const text = message.text();
      if (
        (message.type() === 'warning' || message.type() === 'error') &&
        hydrationErrorPattern.test(text)
      ) {
        hydrationMessages.push(text);
      }
    });

    page.on('pageerror', (error) => {
      if (hydrationErrorPattern.test(error.message)) {
        hydrationMessages.push(error.message);
      }
    });

    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByRole('heading').first()).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});
    expect(hydrationMessages).toEqual([]);
  });
}
