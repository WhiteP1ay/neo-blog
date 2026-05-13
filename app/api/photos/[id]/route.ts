import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { photosTable } from '@/server/db/schema';
import { getSession, requireAdminSession } from '@/server/utils/auth';

type UpdatePhotoBody = {
  title?: unknown;
  description?: unknown;
  coverUrl?: unknown;
  type?: unknown;
  isHidden?: unknown;
};

function parseId(rawId: string): number | null {
  const parsed = Number.parseInt(rawId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const photoId = parseId(id);
    if (photoId == null) {
      return NextResponse.json({ error: '无效 photo ID' }, { status: 400 });
    }

    const row = await db.query.photosTable.findFirst({
      where: (photos, { eq: eqFn }) => eqFn(photos.id, photoId),
    });
    if (!row) {
      return NextResponse.json({ error: 'photo 不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('获取 photo 详情失败:', error);
    return NextResponse.json({ error: '获取 photo 详情失败' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === '未登录' ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const photoId = parseId(id);
    if (photoId == null) {
      return NextResponse.json({ error: '无效 photo ID' }, { status: 400 });
    }

    const body = (await request.json()) as UpdatePhotoBody;
    const updatePayload: Partial<typeof photosTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: 'title 不能为空' }, { status: 400 });
      }
      updatePayload.title = title;
    }
    if (typeof body.description === 'string') {
      updatePayload.description = body.description;
    }
    if (typeof body.coverUrl === 'string') {
      updatePayload.coverUrl = body.coverUrl;
    }
    if (typeof body.type === 'string') {
      updatePayload.type = body.type;
    }
    if (typeof body.isHidden === 'boolean') {
      updatePayload.isHidden = body.isHidden;
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ error: '未提供可更新字段' }, { status: 400 });
    }

    const updated = await db.update(photosTable).set(updatePayload).where(eq(photosTable.id, photoId)).returning();
    if (!updated[0]) {
      return NextResponse.json({ error: 'photo 不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error('更新 photo 失败:', error);
    return NextResponse.json({ error: '更新 photo 失败' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === '未登录' ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const photoId = parseId(id);
    if (photoId == null) {
      return NextResponse.json({ error: '无效 photo ID' }, { status: 400 });
    }

    const deleted = await db.delete(photosTable).where(eq(photosTable.id, photoId)).returning({ id: photosTable.id });
    if (!deleted[0]) {
      return NextResponse.json({ error: 'photo 不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除 photo 失败:', error);
    return NextResponse.json({ error: '删除 photo 失败' }, { status: 500 });
  }
}
