import { count, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postTypeAssignmentsTable, postTypesTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type UpdateBody = {
  code?: unknown;
  nameZh?: unknown;
  nameEn?: unknown;
  suppressLinkedPostsGlobally?: unknown;
};

function revalidateBlogListPaths() {
  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/en/blog');
}

function parseId(id: string): number | null {
  const n = Number.parseInt(id, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const { id } = await params;
  const typeId = parseId(id);
  if (!typeId) {
    return NextResponse.json({ error: '无效 ID' }, { status: 400 });
  }
  const row = await db.query.postTypesTable.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.id, typeId),
  });
  if (!row) {
    return NextResponse.json({ error: '类型不存在' }, { status: 404 });
  }
  return NextResponse.json({ data: row });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const { id } = await params;
  const typeId = parseId(id);
  if (!typeId) {
    return NextResponse.json({ error: '无效 ID' }, { status: 400 });
  }

  const body = (await request.json()) as UpdateBody;
  const patch: Partial<typeof postTypesTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof body.code === 'string') {
    const s = body.code.trim();
    if (!s) {
      return NextResponse.json({ error: 'code 不能为空' }, { status: 400 });
    }
    patch.code = s;
  }
  if (typeof body.nameZh === 'string') {
    const s = body.nameZh.trim();
    if (!s) {
      return NextResponse.json({ error: 'nameZh 不能为空' }, { status: 400 });
    }
    patch.nameZh = s;
  }
  if (typeof body.nameEn === 'string') {
    const s = body.nameEn.trim();
    if (!s) {
      return NextResponse.json({ error: 'nameEn 不能为空' }, { status: 400 });
    }
    patch.nameEn = s;
  }
  if (typeof body.suppressLinkedPostsGlobally === 'boolean') {
    patch.suppressLinkedPostsGlobally = body.suppressLinkedPostsGlobally;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: '未提供可更新字段' }, { status: 400 });
  }

  try {
    const updated = await db.update(postTypesTable).set(patch).where(eq(postTypesTable.id, typeId)).returning();
    if (!updated[0]) {
      return NextResponse.json({ error: '类型不存在' }, { status: 404 });
    }
    revalidateBlogListPaths();
    return NextResponse.json({ data: updated[0] });
  } catch {
    return NextResponse.json({ error: '更新失败，code 可能与其它行冲突' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }
  const { id } = await params;
  const typeId = parseId(id);
  if (!typeId) {
    return NextResponse.json({ error: '无效 ID' }, { status: 400 });
  }

  const [usage] = await db
    .select({ n: count() })
    .from(postTypeAssignmentsTable)
    .where(eq(postTypeAssignmentsTable.typeId, typeId));
  if ((usage?.n ?? 0) > 0) {
    return NextResponse.json({ error: '仍有文章关联该类型，无法删除' }, { status: 400 });
  }

  const deleted = await db
    .delete(postTypesTable)
    .where(eq(postTypesTable.id, typeId))
    .returning({ id: postTypesTable.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: '类型不存在' }, { status: 404 });
  }
  revalidateBlogListPaths();
  return NextResponse.json({ success: true });
}
