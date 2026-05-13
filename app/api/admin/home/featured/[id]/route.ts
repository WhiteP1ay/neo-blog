import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type ToggleBody = {
  homeFeatured?: unknown;
};

function parseId(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * 切换某文章是否上首页精选。
 * 加入时把 `homeSortOrder` 置为当前最大值 + 1，确保排到末尾；移除时不改顺序值。
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  const body = (await request.json()) as ToggleBody;
  if (typeof body.homeFeatured !== 'boolean') {
    return NextResponse.json({ error: '缺少 homeFeatured 字段' }, { status: 400 });
  }

  const existing = await db
    .select({ id: postsTable.id, homeFeatured: postsTable.homeFeatured })
    .from(postsTable)
    .where(eq(postsTable.id, postId))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }

  let nextSortOrder: number | undefined;
  if (body.homeFeatured && !existing[0].homeFeatured) {
    const tail = await db
      .select({ homeSortOrder: postsTable.homeSortOrder })
      .from(postsTable)
      .where(eq(postsTable.homeFeatured, true))
      .orderBy(desc(postsTable.homeSortOrder))
      .limit(1);
    nextSortOrder = (tail[0]?.homeSortOrder ?? 0) + 1;
  }

  await db
    .update(postsTable)
    .set({
      homeFeatured: body.homeFeatured,
      ...(nextSortOrder !== undefined ? { homeSortOrder: nextSortOrder } : {}),
    })
    .where(eq(postsTable.id, postId));

  revalidatePath('/');
  return NextResponse.json({ success: true });
}
