import { and, count, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { ADMIN_REORDER_UNCATEGORIZED_TYPE_ID } from '@/lib/admin-post-constants';
import { db } from '@/server/db/db';
import { postTypeAssignmentsTable, postsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type ReorderBody = {
  orderedIds?: unknown;
  /** 当前筛选的类型 id；`-1` 表示仅含「无任何类型关联」的文章。 */
  typeId?: unknown;
};

async function postInReorderScope(postId: number, typeId: number): Promise<boolean> {
  if (typeId === ADMIN_REORDER_UNCATEGORIZED_TYPE_ID) {
    const [row] = await db
      .select({ n: count() })
      .from(postTypeAssignmentsTable)
      .where(eq(postTypeAssignmentsTable.postId, postId));
    return (row?.n ?? 0) === 0;
  }
  const [row] = await db
    .select({ postId: postTypeAssignmentsTable.postId })
    .from(postTypeAssignmentsTable)
    .where(
      and(
        eq(postTypeAssignmentsTable.postId, postId),
        eq(postTypeAssignmentsTable.typeId, typeId),
      ),
    )
    .limit(1);
  return row !== undefined;
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = (await request.json()) as ReorderBody;
  if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
    return NextResponse.json({ error: 'orderedIds 不能为空' }, { status: 400 });
  }
  const typeIdRaw = body.typeId;
  const typeId =
    typeof typeIdRaw === 'number'
      ? typeIdRaw
      : typeof typeIdRaw === 'string'
        ? Number.parseInt(typeIdRaw, 10)
        : Number.NaN;
  if (!Number.isInteger(typeId) || typeId === 0) {
    return NextResponse.json({ error: '缺少或无效的 typeId 字段' }, { status: 400 });
  }

  const orderedIds = body.orderedIds.map((item) => Number(item));
  if (orderedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return NextResponse.json({ error: 'orderedIds 必须为正整数数组' }, { status: 400 });
  }

  const checks = await Promise.all(orderedIds.map((id) => postInReorderScope(id, typeId)));
  if (checks.some((ok) => !ok)) {
    return NextResponse.json({ error: '存在不属于当前类型筛选的文章' }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await tx
        .update(postsTable)
        .set({
          sortOrder: index + 1,
          updatedAt: new Date(),
        })
        .where(eq(postsTable.id, orderedIds[index]));
    }
  });

  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/en/blog');
  return NextResponse.json({ success: true });
}
