import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/db';
import { assertPostIdsExist } from '@/server/utils/assert-post-ids-exist';
import { assertTypeIdsValid } from '@/server/utils/assert-type-ids-valid';
import { parseBulkPostIds } from '@/server/utils/parse-bulk-post-ids';
import { parseTypeIdsField } from '@/server/utils/parse-type-ids';
import { replacePostTypeAssignments } from '@/server/utils/post-type-assignments';
import { requireAdmin } from '@/server/utils/require-admin';

type BulkTypesBody = {
  postIds?: unknown;
  typeIds?: unknown;
};

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  let body: BulkTypesBody;
  try {
    body = (await request.json()) as BulkTypesBody;
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const postIdsParsed = parseBulkPostIds(body.postIds);
  if (!postIdsParsed.ok) {
    return NextResponse.json({ error: postIdsParsed.error }, { status: 400 });
  }

  const typeIdsParsed = parseTypeIdsField(body.typeIds);
  if (typeIdsParsed === 'omit' || !typeIdsParsed.ok) {
    return NextResponse.json({ error: 'typeIds 须为整数数组（可空）' }, { status: 400 });
  }

  if (!(await assertPostIdsExist(db, postIdsParsed.ids))) {
    return NextResponse.json({ error: '存在无效的博文 id' }, { status: 400 });
  }
  if (!(await assertTypeIdsValid(db, typeIdsParsed.ids))) {
    return NextResponse.json({ error: '存在无效的类型 id' }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    for (const postId of postIdsParsed.ids) {
      await replacePostTypeAssignments(tx, postId, typeIdsParsed.ids);
    }
  });

  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/en/blog');
  return NextResponse.json({ success: true, updatedCount: postIdsParsed.ids.length });
}
