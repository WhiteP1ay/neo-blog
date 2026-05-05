import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { commentsTable, postsTable } from '@/server/db/schema';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { requireAdmin } from '@/server/utils/require-admin';

type UpdatePostBody = {
  title?: unknown;
  content?: unknown;
  markdownContent?: unknown;
  excerpt?: unknown;
  coverUrl?: unknown;
  type?: unknown;
  isHidden?: unknown;
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
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  const body = (await request.json()) as UpdatePostBody;
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  const hasContentUpdate = typeof body.content === 'string';
  const hasMarkdownUpdate = typeof body.markdownContent === 'string';
  const hasManualExcerpt = typeof body.excerpt === 'string';
  const hasManualCover = typeof body.coverUrl === 'string';

  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    updatePayload.title = title;
  }
  if (typeof body.content === 'string') {
    if (!body.content.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }
    updatePayload.content = body.content;
  }
  if (typeof body.markdownContent === 'string') updatePayload.markdownContent = body.markdownContent;
  if (typeof body.excerpt === 'string') updatePayload.excerpt = body.excerpt;
  if (typeof body.coverUrl === 'string') updatePayload.coverUrl = body.coverUrl;
  if (typeof body.type === 'string') updatePayload.type = body.type;
  if (typeof body.isHidden === 'boolean') updatePayload.isHidden = body.isHidden;

  if (hasContentUpdate || hasMarkdownUpdate) {
    const metadata = derivePostMetadata({
      content: typeof body.content === 'string' ? body.content : null,
      markdownContent: typeof body.markdownContent === 'string' ? body.markdownContent : null,
    });
    if (!hasManualExcerpt) {
      updatePayload.excerpt = metadata.excerpt;
    }
    if (!hasManualCover) {
      updatePayload.coverUrl = metadata.coverUrl;
    }
  }

  const updated = await db
    .update(postsTable)
    .set(updatePayload)
    .where(eq(postsTable.id, postId))
    .returning();

  if (!updated[0]) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }
  return NextResponse.json({ data: updated[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseId(id);
  if (!postId) {
    return NextResponse.json({ error: '无效博文ID' }, { status: 400 });
  }

  await db
    .delete(commentsTable)
    .where(and(eq(commentsTable.targetType, 'post'), eq(commentsTable.targetId, postId)));

  const deleted = await db.delete(postsTable).where(eq(postsTable.id, postId)).returning({ id: postsTable.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: '博文不存在' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
