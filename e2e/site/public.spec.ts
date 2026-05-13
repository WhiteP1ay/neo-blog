import { expect, test } from '@playwright/test';

test.describe('C 端前台', () => {
  test('首页可访问', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  });

  test('博客列表可访问', async ({ page }) => {
    const res = await page.goto('/blog');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  });

  test('关于页（中文）', async ({ page }) => {
    const res = await page.goto('/about');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '关于本站' })).toBeVisible();
  });

  test('英文首页与关于', async ({ page }) => {
    let res = await page.goto('/en');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();

    res = await page.goto('/en/about');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'About this site' })).toBeVisible();
  });

  test('英文博客列表', async ({ page }) => {
    const res = await page.goto('/en/blog');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  });

  test('博文详情（从列表取首条链接）', async ({ page }, testInfo) => {
    await page.goto('/blog');
    const link = page.locator('main a[href^="/blog/"]').first();
    if ((await link.count()) === 0) {
      testInfo.skip();
      return;
    }
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/blog\/\d+/);
    await page.goto(href as string);
    await expect(page.locator('article.retro-content')).toBeVisible({ timeout: 15_000 });
  });
});
