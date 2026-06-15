import { test, expect } from '@playwright/test';

// 이슈 #108 회귀 방지: /subscription·/loan·/checklist 헤더 nav 누락 버그
const paths = ['/subscription', '/loan', '/checklist'];

for (const path of paths) {
  test(`${path} 헤더에 nav 링크가 표시된다`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    await expect(nav.getByRole('link', { name: '청약' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '대출' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '체크리스트' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '실거래가' })).toBeVisible();
  });
}
