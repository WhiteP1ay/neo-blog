import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { commentsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type UpdateCommentBody = {
  author?: unknown;
  email?: unknown;
  content?: unknown;
};

function parseId(id: string): number | null {
  const value = Number.parseInt(id, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const commentId = parseId(id);
  if (!commentId) {
    return NextResponse.json({ error: '无效评论ID' }, { status: 400 });
  }

  const body = (await request.json()) as UpdateCommentBody;
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (typeof body.author === 'string') updatePayload.author = body.author.trim();
  if (typeof body.email === 'string') updatePayload.email = body.email.trim();
  if (typeof body.content === 'string') updatePayload.content = body.content.trim();

  const updated = await db
    .update(commentsTable)
    .set(updatePayload)
    .where(eq(commentsTable.id, commentId))
    .returning();
  if (!updated[0]) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  return NextResponse.json({ data: updated[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const commentId = parseId(id);
  if (!commentId) {
    return NextResponse.json({ error: '无效评论ID' }, { status: 400 });
  }

  const deleted = await db
    .delete(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .returning({ id: commentsTable.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
