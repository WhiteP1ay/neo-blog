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

  test('关于页（中文）：可访问且展示公众号二维码', async ({ page, request }) => {
    const res = await page.goto('/about');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '关于本站' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '微信公众号' })).toBeVisible();

    const qr = page.getByRole('img', { name: '微信公众号二维码，使用微信扫一扫关注' });
    await expect(qr).toBeVisible();
    await expect(qr).toHaveAttribute('src', /wxqr/i);

    const asset = await request.get('/wxqr.jpg');
    expect(asset.ok()).toBeTruthy();
    expect(asset.headers()['content-type'] ?? '').toMatch(/jpeg|jpe|octet-stream/i);
  });

  test('英文首页可访问', async ({ page }) => {
    const res = await page.goto('/en');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
  });

  test('关于页（英文）：可访问且展示公众号二维码', async ({ page, request }) => {
    const res = await page.goto('/en/about');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'About this site' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'WeChat official account' })).toBeVisible();

    const qr = page.getByRole('img', { name: 'WeChat public account QR code — scan to follow' });
    await expect(qr).toBeVisible();
    await expect(qr).toHaveAttribute('src', /wxqr/i);

    const asset = await request.get('/wxqr.jpg');
    expect(asset.ok()).toBeTruthy();
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
