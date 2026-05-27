import { expect, test, type Page } from '@playwright/test';
import { createPost, createPostType, deletePost, deletePostType } from './helpers/posts-api';

const hasAdminCreds = Boolean(process.env.E2E_ADMIN_USER && process.env.E2E_ADMIN_PASSWORD);

function bulkActionBar(page: Page) {
  return page.locator('div.border-primary\\/30').filter({ has: page.getByText(/^已选 \d+ 篇/) });
}

function selectPostRow(page: Page, title: string) {
  return page.getByRole('row').filter({ hasText: title }).getByRole('checkbox').click();
}

async function selectPosts(page: Page, titles: string[]) {
  for (const title of titles) {
    await selectPostRow(page, title);
  }
  await expect(page.getByText(`已选 ${titles.length} 篇`)).toBeVisible();
}

async function waitBulkVisibility(page: Page, isHidden: boolean) {
  return page.waitForResponse(async (r) => {
    if (r.request().method() !== 'PUT' || !r.url().includes('/api/admin/posts/bulk-visibility')) {
      return false;
    }
    try {
      const body = (await r.request().postDataJSON()) as { isHidden?: boolean };
      return body.isHidden === isHidden && r.ok();
    } catch {
      return false;
    }
  });
}

test.describe('博文批量操作', () => {
  test.beforeAll(() => {
    test.skip(!hasAdminCreds, '需设置 E2E_ADMIN_USER 与 E2E_ADMIN_PASSWORD（管理员账号）');
  });

  test.describe
    .serial('核心流程', () => {
      test('博文批量：多选、可见性、改类型、删除', async ({ page, request }) => {
        test.setTimeout(120_000);
        const slug = `${Date.now()}`;
        const titleA = `E2E Bulk A ${slug}`;
        const titleB = `E2E Bulk B ${slug}`;
        const nameZh = `E2E批量${slug}`;
        const body = `# ${slug}\n\nbulk e2e body ${slug}`;

        const postType = await createPostType(request, {
          code: `e2e-bulk-${slug}`,
          nameZh,
          nameEn: `E2E Bulk ${slug}`,
        });
        await createPost(request, { title: titleA, content: body });
        await createPost(request, { title: titleB, content: body });

        try {
          const res = await page.goto('/admin/posts');
          expect(res?.ok()).toBeTruthy();
          await expect(page.getByRole('heading', { name: '博文管理' })).toBeVisible();
          await expect(page.getByRole('row').filter({ hasText: titleA })).toBeVisible({ timeout: 20_000 });

          await selectPosts(page, [titleA, titleB]);

          const hideWait = waitBulkVisibility(page, true);
          await bulkActionBar(page).getByRole('button', { name: '隐藏' }).click();
          await hideWait;

          const rowA = page.getByRole('row').filter({ hasText: titleA });
          const rowB = page.getByRole('row').filter({ hasText: titleB });
          await expect(rowA.getByRole('switch', { name: '前台显示' })).not.toBeChecked();
          await expect(rowB.getByRole('switch', { name: '前台显示' })).not.toBeChecked();

          await selectPosts(page, [titleA, titleB]);
          const showWait = waitBulkVisibility(page, false);
          await bulkActionBar(page).getByRole('button', { name: '显示' }).click();
          await showWait;
          await expect(rowA.getByRole('switch', { name: '前台显示' })).toBeChecked();
          await expect(rowB.getByRole('switch', { name: '前台显示' })).toBeChecked();

          await selectPosts(page, [titleA, titleB]);
          await bulkActionBar(page).getByRole('button', { name: '改类型' }).click();
          const typeDialog = page.getByRole('dialog');
          await expect(typeDialog.getByRole('heading', { name: '批量修改类型' })).toBeVisible();
          await typeDialog.locator('summary').click();
          await typeDialog.getByRole('checkbox', { name: new RegExp(nameZh) }).check();

          const bulkTypeWait = page.waitForResponse(
            (r) => r.request().method() === 'PUT' && r.url().includes('/api/admin/posts/bulk-types') && r.ok(),
          );
          await page.getByRole('button', { name: '确认' }).click();
          await bulkTypeWait;
          await expect(typeDialog.getByRole('heading', { name: '批量修改类型' })).toBeHidden();

          await expect(rowA).toContainText(nameZh);
          await expect(rowB).toContainText(nameZh);

          await page.getByRole('link', { name: nameZh }).click();
          await expect(page.getByRole('row').filter({ hasText: titleA })).toBeVisible();
          await expect(page.getByRole('row').filter({ hasText: titleB })).toBeVisible();

          const headerCheckbox = page.getByRole('checkbox', { name: '全选当前列表' });
          await headerCheckbox.click();
          await expect(page.getByText('已选 2 篇')).toBeVisible();
          await bulkActionBar(page).getByRole('button', { name: '取消选择' }).click();
          await expect(bulkActionBar(page)).toHaveCount(0);

          await headerCheckbox.click();
          await expect(page.getByText('已选 2 篇')).toBeVisible();

          await bulkActionBar(page).getByRole('button', { name: '删除' }).click();
          await expect(page.getByRole('heading', { name: '批量删除' })).toBeVisible();
          const bulkDeleteWait = page.waitForResponse(
            (r) => r.request().method() === 'DELETE' && r.url().includes('/api/admin/posts/bulk') && r.ok(),
          );
          await page.getByRole('button', { name: '确认删除' }).click();
          await bulkDeleteWait;

          await expect(page.getByRole('row').filter({ hasText: titleA })).toHaveCount(0);
          await expect(page.getByRole('row').filter({ hasText: titleB })).toHaveCount(0);
        } finally {
          await deletePostType(request, postType.id).catch(() => {});
        }
      });
    });

  test('博文批量 AI 润色（mock）', async ({ page, request }) => {
    test.setTimeout(60_000);
    const slug = `${Date.now()}`;
    const title = `E2E Bulk Polish ${slug}`;
    const body = `# ${slug}\n\npolish mock ${slug}`;

    const post = await createPost(request, { title, content: body });
    let polishCalls = 0;

    await page.route('**/api/admin/posts/*/ai-polish/run', async (route) => {
      polishCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: post.id } }),
      });
    });

    try {
      const res = await page.goto('/admin/posts');
      expect(res?.ok()).toBeTruthy();
      await expect(page.getByRole('row').filter({ hasText: title })).toBeVisible({ timeout: 20_000 });

      await selectPostRow(page, title);
      await expect(page.getByText('已选 1 篇')).toBeVisible();

      await bulkActionBar(page).getByRole('button', { name: 'AI 润色' }).click();
      await expect(page.getByRole('heading', { name: '批量 AI 润色' })).toBeVisible();
      await page.getByRole('checkbox', { name: /中文润色/ }).check();
      await page.getByRole('button', { name: '开始' }).click();

      await expect(page.getByText('批量润色完成', { exact: false })).toBeVisible({ timeout: 15_000 });
      expect(polishCalls).toBe(1);
    } finally {
      await deletePost(request, post.id).catch(() => {});
    }
  });
});
