import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { commentsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type CreateCommentBody = {
  targetType?: unknown;
  targetId?: unknown;
  parentId?: unknown;
  author?: unknown;
  email?: unknown;
  content?: unknown;
};

function isValidTargetType(value: string): value is 'post' | 'photo' {
  return value === 'post' || value === 'photo';
}

async function ensureTargetExists(targetType: 'post' | 'photo', targetId: number) {
  if (targetType === 'post') {
    const post = await db.query.postsTable.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.id, targetId),
    });
    return post != null;
  }
  const photo = await db.query.photosTable.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, targetId),
  });
  return photo != null;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const targetIdRaw = searchParams.get('targetId');

  if (targetType && !isValidTargetType(targetType)) {
    return NextResponse.json({ error: 'targetType 仅支持 post 或 photo' }, { status: 400 });
  }

  let targetId = 0;
  if (targetIdRaw) {
    targetId = Number.parseInt(targetIdRaw, 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      return NextResponse.json({ error: '无效 targetId' }, { status: 400 });
    }
  }

  const whereExpr = targetType && targetId
    ? and(eq(commentsTable.targetType, targetType), eq(commentsTable.targetId, targetId))
    : targetType
      ? eq(commentsTable.targetType, targetType)
      : undefined;

  const comments = whereExpr
    ? await db.select().from(commentsTable).where(whereExpr).orderBy(asc(commentsTable.id))
    : await db.select().from(commentsTable).orderBy(asc(commentsTable.id));

  return NextResponse.json({ data: comments });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = (await request.json()) as CreateCommentBody;
  const targetType = typeof body.targetType === 'string' ? body.targetType : '';
  const targetId = typeof body.targetId === 'number' ? body.targetId : Number.NaN;
  const parentId = typeof body.parentId === 'number' ? body.parentId : null;
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : null;
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!isValidTargetType(targetType)) {
    return NextResponse.json({ error: 'targetType 仅支持 post 或 photo' }, { status: 400 });
  }
  if (!Number.isFinite(targetId) || targetId <= 0) {
    return NextResponse.json({ error: '无效 targetId' }, { status: 400 });
  }
  if (!author) {
    return NextResponse.json({ error: '作者不能为空' }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
  }

  const targetExists = await ensureTargetExists(targetType, targetId);
  if (!targetExists) {
    return NextResponse.json({ error: '关联目标不存在' }, { status: 400 });
  }

  const created = await db
    .insert(commentsTable)
    .values({
      targetType,
      targetId,
      parentId,
      author,
      email,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ data: created[0] });
}
