import * as fs from 'node:fs';
import * as path from 'node:path';
import { test as setup } from '@playwright/test';

const authFile = path.join(process.cwd(), 'playwright', '.auth', 'admin.json');

/**
 * 在 webServer 就绪后执行：写入 storageState（有凭据则登录，无则空 Cookie）。
 * 使用 setup project + dependencies，避免在 Node globalSetup 阶段访问未启动的 dev 服务。
 */
setup('authenticate admin session', async ({ browser }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  const user = process.env.E2E_ADMIN_USER;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const context = await browser.newContext();

  if (!user || !password) {
    await context.storageState({ path: authFile });
    await context.close();
    console.warn('[e2e] E2E_ADMIN_USER / E2E_ADMIN_PASSWORD 未设置：admin 用例将跳过');
    return;
  }

  const page = await context.newPage();
  await page.goto('/login');
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 30_000 });
  await context.storageState({ path: authFile });
  await context.close();
});
