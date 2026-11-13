// template: playwright-e2e v0.1
import { defineConfig, devices } from '@playwright/test';

// 후행 슬래시 보장: baseURL 에 path(예: /api)가 있어도 상대경로('health')가 prefix 를 유지.
// spec 에서 선행 슬래시('/health')를 쓰면 origin 기준 해석이라 path prefix 가 탈락한다.
const baseURL = (process.env.ZIPATH_BASE_URL || 'https://zipath-web.vercel.app').replace(/\/*$/, '/');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
