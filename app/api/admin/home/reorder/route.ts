import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type ReorderBody = {
  orderedIds?: unknown;
};

/**
 * 重写首页精选的顺序：传入的数组下标即为 `homeSortOrder`（从 1 开始）。
 */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = (await request.json()) as ReorderBody;
  if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
    return NextResponse.json({ error: 'orderedIds 不能为空' }, { status: 400 });
  }

  const orderedIds = body.orderedIds.map((item) => Number(item));
  if (orderedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return NextResponse.json({ error: 'orderedIds 必须为正整数数组' }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await tx
        .update(postsTable)
        .set({ homeSortOrder: index + 1 })
        .where(eq(postsTable.id, orderedIds[index]));
    }
  });

  revalidatePath('/');
  return NextResponse.json({ success: true });
}
