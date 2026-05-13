import { asc, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postTypesTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type CreateBody = {
  code?: unknown;
  nameZh?: unknown;
  nameEn?: unknown;
  suppressLinkedPostsGlobally?: unknown;
};

function normalizeTypeCode(raw: string): string {
  return raw.trim();
}

function revalidateBlogListPaths() {
  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/en/blog');
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(postTypesTable)
    .orderBy(asc(postTypesTable.sortOrder), asc(postTypesTable.id));
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = (await request.json()) as CreateBody;
  const code = typeof body.code === 'string' ? normalizeTypeCode(body.code) : '';
  const nameZh = typeof body.nameZh === 'string' ? body.nameZh.trim() : '';
  const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : '';
  if (!code || !nameZh || !nameEn) {
    return NextResponse.json({ error: 'code、nameZh、nameEn 均不能为空' }, { status: 400 });
  }
  const suppress = body.suppressLinkedPostsGlobally === true;

  const maxRow = await db
    .select({ sortOrder: postTypesTable.sortOrder })
    .from(postTypesTable)
    .orderBy(desc(postTypesTable.sortOrder))
    .limit(1);
  const nextOrder = (maxRow[0]?.sortOrder ?? -1) + 1;

  try {
    const inserted = await db
      .insert(postTypesTable)
      .values({
        code,
        nameZh,
        nameEn,
        sortOrder: nextOrder,
        suppressLinkedPostsGlobally: suppress,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    revalidateBlogListPaths();
    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '创建失败，code 可能已存在' }, { status: 400 });
  }
}
