import { expect, test } from '@playwright/test';

const hasAdminCreds = Boolean(process.env.E2E_ADMIN_USER && process.env.E2E_ADMIN_PASSWORD);

test.describe('管理后台', () => {
  test.beforeAll(() => {
    test.skip(!hasAdminCreds, '需设置 E2E_ADMIN_USER 与 E2E_ADMIN_PASSWORD（管理员账号）');
  });

  test('博文管理页', async ({ page }) => {
    const res = await page.goto('/admin/posts');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '博文管理' })).toBeVisible();
  });

  test('类型管理页', async ({ page }) => {
    const res = await page.goto('/admin/post-types');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '类型管理' })).toBeVisible();
  });
});
