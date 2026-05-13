import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { commentsTable, photosTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';

type UpdatePhotoBody = {
  title?: unknown;
  description?: unknown;
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
  const photoId = parseId(id);
  if (!photoId) {
    return NextResponse.json({ error: '无效照片ID' }, { status: 400 });
  }

  const body = (await request.json()) as UpdatePhotoBody;
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (typeof body.title === 'string') updatePayload.title = body.title.trim();
  if (typeof body.description === 'string') updatePayload.description = body.description;
  if (typeof body.coverUrl === 'string') updatePayload.coverUrl = body.coverUrl;
  if (typeof body.type === 'string') updatePayload.type = body.type;
  if (typeof body.isHidden === 'boolean') updatePayload.isHidden = body.isHidden;

  const updated = await db.update(photosTable).set(updatePayload).where(eq(photosTable.id, photoId)).returning();

  if (!updated[0]) {
    return NextResponse.json({ error: '照片不存在' }, { status: 404 });
  }
  return NextResponse.json({ data: updated[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;
  const photoId = parseId(id);
  if (!photoId) {
    return NextResponse.json({ error: '无效照片ID' }, { status: 400 });
  }

  await db.delete(commentsTable).where(and(eq(commentsTable.targetType, 'photo'), eq(commentsTable.targetId, photoId)));

  const deleted = await db.delete(photosTable).where(eq(photosTable.id, photoId)).returning({ id: photosTable.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: '照片不存在' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
