import { platform } from 'node:os';
import { expect, test, type Page } from '@playwright/test';

const hasAdminCreds = Boolean(process.env.E2E_ADMIN_USER && process.env.E2E_ADMIN_PASSWORD);

/** Zen 全屏层（portal 到 body）内的可见富文本区 */
function zenEditor(page: Page) {
  return page.locator('.fixed.inset-0.z-50').locator('[contenteditable="true"]').filter({ visible: true }).first();
}

async function selectAllShortcut(page: Page) {
  const mod = platform() === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${mod}+A`);
}

test.describe('管理后台', () => {
  test.beforeAll(() => {
    test.skip(!hasAdminCreds, '需设置 E2E_ADMIN_USER 与 E2E_ADMIN_PASSWORD（管理员账号）');
  });

  test('博文管理页', async ({ page }) => {
    const res = await page.goto('/admin/posts');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '博文管理' })).toBeVisible();
  });

  test('博文增删改查（Zen）', async ({ page }) => {
    const slug = `${Date.now()}`;
    const title = `E2E CRUD ${slug}`;
    const bodyMarker = `正文 ${slug}`;
    const editMarker = `已编辑 ${slug}`;

    const res = await page.goto('/admin/posts');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '博文管理' })).toBeVisible();

    // —— 增 ——
    await page.getByRole('button', { name: '新增博文' }).click();
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    await zenEditor(page).click();
    await page.getByRole('combobox', { name: '文本格式' }).selectOption('h1');
    await page.keyboard.type(title);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.getByRole('combobox', { name: '文本格式' }).selectOption('paragraph');
    await page.keyboard.type(bodyMarker);

    const createWait = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        r.url().includes('/api/admin/posts') &&
        !r.url().includes('reorder') &&
        r.ok(),
    );
    await page.getByRole('button', { name: '保存' }).click();
    await createWait;
    await expect(page.getByRole('button', { name: '保存' })).toBeHidden();

    // —— 查：列表出现标题 ——
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible({ timeout: 20_000 });

    // —— 改：追加正文后保存 ——
    const editGetWait = page.waitForResponse(
      (r) => r.request().method() === 'GET' && /\/api\/admin\/posts\/\d+$/.test(r.url()) && r.ok(),
    );
    await row.getByRole('button', { name: '编辑' }).click();
    await editGetWait;
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    await expect(zenEditor(page)).toContainText(bodyMarker, { timeout: 20_000 });

    await zenEditor(page).click();
    await selectAllShortcut(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.keyboard.type(editMarker);

    const putWait = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && /\/api\/admin\/posts\/\d+$/.test(r.url()) && r.ok(),
    );
    await page.getByRole('button', { name: '保存' }).click();
    await putWait;
    await expect(page.getByRole('button', { name: '保存' })).toBeHidden();

    // —— 查：再次打开编辑应含追加内容 ——
    const rowAgain = page.getByRole('row').filter({ hasText: title });
    const editGetWait2 = page.waitForResponse(
      (r) => r.request().method() === 'GET' && /\/api\/admin\/posts\/\d+$/.test(r.url()) && r.ok(),
    );
    await rowAgain.getByRole('button', { name: '编辑' }).click();
    await editGetWait2;
    await expect(zenEditor(page)).toContainText(editMarker, { timeout: 20_000 });
    await page.getByRole('button', { name: '关闭' }).click();
    await expect(page.getByRole('button', { name: '保存' })).toBeHidden();

    // —— 删 ——
    const deleteWait = page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && /\/api\/admin\/posts\/\d+$/.test(r.url()) && r.ok(),
    );
    await rowAgain.getByRole('button', { name: '删除' }).click();
    await deleteWait;
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0);
  });

  test('类型管理页', async ({ page }) => {
    const res = await page.goto('/admin/post-types');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: '类型管理' })).toBeVisible();
  });
});
