import { defineConfig, devices } from '@playwright/test';

const port = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : 4173;
const baseURL = `http://127.0.0.1:${port}/Vitals.AI/`;
const skipBuild = process.env.E2E_SKIP_BUILD === '1';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'agent-pages-smoke.spec.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: skipBuild
      ? 'node scripts/serve-pages.mjs'
      : 'npm run build:pages && node scripts/serve-pages.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 420_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
