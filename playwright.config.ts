import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PW_PORT ?? 4173);
const CI = !!process.env.CI;

/**
 * End-to-end tests run against the production build served by `astro preview`.
 * Run `pnpm build` first (CI downloads the `dist` artifact instead).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  ...(CI ? { workers: 2 } : {}),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    // --ignore-lock: Astro's preview otherwise refuses to start while another preview runs.
    command: `pnpm preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
