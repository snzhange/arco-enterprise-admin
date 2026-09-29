import { defineConfig, devices } from '@playwright/test'

const isVisual = process.env.PLAYWRIGHT_PROJECT === 'visual'

export default defineConfig({
  testDir: './e2e',
  testMatch: isVisual ? /visual\.spec\.ts/ : /admin\.spec\.ts/,
  fullyParallel: !isVisual,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: isVisual ? 'playwright-report/visual' : 'playwright-report/functional', open: 'never' }]]
    : [['list'], ['html', { outputFolder: isVisual ? 'playwright-report/visual' : 'playwright-report/functional', open: 'never' }]],
  outputDir: isVisual ? 'test-results/visual' : 'test-results/functional',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: isVisual ? 'chromium-linux' : 'functional-chromium-linux',
      use: { ...devices['Desktop Chrome'], channel: 'chromium', viewport: isVisual ? { width: 1440, height: 900 } : { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
