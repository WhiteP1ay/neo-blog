import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Playwright 进程默认不读 .env；与本地 Next 一致：先 .env 再 .env.local 覆盖
loadEnv({ path: path.join(process.cwd(), '.env') });
loadEnv({ path: path.join(process.cwd(), '.env.local'), override: true });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/global-setup.spec.ts',
    },
    {
      name: 'site',
      testMatch: '**/site/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: '**/admin/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
  ],
});
