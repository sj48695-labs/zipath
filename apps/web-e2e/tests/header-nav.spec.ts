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

// 이슈 #121: 모바일 뷰포트 햄버거 메뉴 토글
test('모바일 뷰포트에서 햄버거 메뉴로 nav 링크를 토글한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const response = await page.goto('/subscription');
  expect(response?.status()).toBeLessThan(400);

  const toggle = page.getByRole('button', { name: '메뉴 열기' });
  await expect(toggle).toBeVisible();

  // 클릭 전: 모바일 메뉴 패널 링크가 보이지 않는다
  await expect(page.getByRole('link', { name: '청약' })).toBeHidden();

  await toggle.click();

  const panel = page.locator('#mobile-nav-menu');
  await expect(panel.getByRole('link', { name: '청약' })).toBeVisible();
  await expect(panel.getByRole('link', { name: '대출' })).toBeVisible();
  await expect(panel.getByRole('link', { name: '체크리스트' })).toBeVisible();
  await expect(panel.getByRole('link', { name: '실거래가' })).toBeVisible();
});
