import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { commentsTable, postsTable } from '@/server/db/schema';
import { assertPostIdsExist } from '@/server/utils/assert-post-ids-exist';
import { parseBulkPostIds } from '@/server/utils/parse-bulk-post-ids';
import { requireAdmin } from '@/server/utils/require-admin';

type BulkDeleteBody = {
  postIds?: unknown;
};

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  let body: BulkDeleteBody;
  try {
    body = (await request.json()) as BulkDeleteBody;
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const postIdsParsed = parseBulkPostIds(body.postIds);
  if (!postIdsParsed.ok) {
    return NextResponse.json({ error: postIdsParsed.error }, { status: 400 });
  }

  if (!(await assertPostIdsExist(db, postIdsParsed.ids))) {
    return NextResponse.json({ error: '存在无效的博文 id' }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(commentsTable)
      .where(and(eq(commentsTable.targetType, 'post'), inArray(commentsTable.targetId, postIdsParsed.ids)));
    await tx.delete(postsTable).where(inArray(postsTable.id, postIdsParsed.ids));
  });

  return NextResponse.json({ success: true, deletedCount: postIdsParsed.ids.length });
}
