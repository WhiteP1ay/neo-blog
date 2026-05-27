import { inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { assertPostIdsExist } from '@/server/utils/assert-post-ids-exist';
import { parseBulkPostIds } from '@/server/utils/parse-bulk-post-ids';
import { requireAdmin } from '@/server/utils/require-admin';

type BulkVisibilityBody = {
  postIds?: unknown;
  isHidden?: unknown;
};

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  let body: BulkVisibilityBody;
  try {
    body = (await request.json()) as BulkVisibilityBody;
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const postIdsParsed = parseBulkPostIds(body.postIds);
  if (!postIdsParsed.ok) {
    return NextResponse.json({ error: postIdsParsed.error }, { status: 400 });
  }
  if (typeof body.isHidden !== 'boolean') {
    return NextResponse.json({ error: 'isHidden 须为 boolean' }, { status: 400 });
  }

  if (!(await assertPostIdsExist(db, postIdsParsed.ids))) {
    return NextResponse.json({ error: '存在无效的博文 id' }, { status: 400 });
  }

  const updated = await db
    .update(postsTable)
    .set({ isHidden: body.isHidden, updatedAt: new Date() })
    .where(inArray(postsTable.id, postIdsParsed.ids))
    .returning({ id: postsTable.id });

  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/en/blog');
  return NextResponse.json({ success: true, updatedCount: updated.length });
}
