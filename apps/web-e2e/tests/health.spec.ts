import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/zipath/i);
});

test('home page is interactive', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
