import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postTypesTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type Body = {
  orderedIds?: unknown;
};

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = (await request.json()) as Body;
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
        .update(postTypesTable)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(postTypesTable.id, orderedIds[index]));
    }
  });

  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/en/blog');
  return NextResponse.json({ success: true });
}
