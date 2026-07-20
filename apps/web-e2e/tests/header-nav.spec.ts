import { test, expect } from '@playwright/test';

// 이슈 #127 회귀 방지: 글로벌 헤더 nav 누락 및 페이지별 로고-only 헤더 재도입 버그
const paths = ['/', '/real-price', '/subscription', '/loan', '/checklist'];
const navLabels = ['청약', '대출', '체크리스트', '실거래가'] as const;

for (const path of paths) {
  test(`${path} 헤더에 nav 링크가 표시된다`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    for (const label of navLabels) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  });
}

for (const path of paths) {
  test(`${path} 페이지에 참고용 법적 고지가 표시된다`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByText('참고용이며 법적 효력 없음')).toBeVisible();
  });
}

// 이슈 #121: 모바일 뷰포트 햄버거 메뉴 토글
for (const path of ['/subscription', '/loan']) {
  test(`${path} 모바일 뷰포트에서 햄버거 메뉴로 nav 링크를 토글한다`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    const toggle = page.getByRole('button', { name: '메뉴 열기' });
    await expect(toggle).toBeVisible();

    // 클릭 전: 모바일 메뉴 패널 링크가 보이지 않는다
    await expect(page.getByRole('link', { name: '청약' })).toBeHidden();

    await toggle.click();

    const panel = page.locator('#mobile-nav-menu');
    for (const label of navLabels) {
      await expect(panel.getByRole('link', { name: label })).toBeVisible();
    }
  });
}
