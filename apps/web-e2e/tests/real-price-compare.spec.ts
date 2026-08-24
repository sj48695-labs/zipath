import { test, expect } from '@playwright/test';

test('/real-price/compare loads with key elements', async ({ page }) => {
  const response = await page.goto('/real-price/compare');
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole('heading', { name: '지역 간 비교' })).toBeVisible();
  await expect(page.getByText('현재 지원 범위: 수도권·부산', { exact: false })).toBeVisible();
  await expect(page.getByText('아래 목록에서만 선택', { exact: false })).toBeVisible();
  await expect(page.getByText('참고용이며 법적 효력 없음', { exact: false }).first()).toBeVisible();
  await expect(page.getByPlaceholder('지역 검색...').first()).toBeVisible();
});

test('/real-price/compare search input accepts text', async ({ page }) => {
  await page.goto('/real-price/compare');
  const search = page.getByPlaceholder('지역 검색...').first();
  await search.fill('강남');
  await expect(search).toHaveValue('강남');
});
