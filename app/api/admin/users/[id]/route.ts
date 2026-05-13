import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { usersTable } from '@/server/db/schema';
import { hashPassword } from '@/server/utils/auth';
import { requireAdmin } from '@/server/utils/require-admin';

type UpdateUserBody = {
  name?: unknown;
  password?: unknown;
  isAdmin?: unknown;
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

  const resolvedParams = await params;
  const userId = parseId(resolvedParams.id);
  if (!userId) {
    return NextResponse.json({ error: '无效用户ID' }, { status: 400 });
  }

  const body = (await request.json()) as UpdateUserBody;
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: '用户名长度必须在 2-50 之间' }, { status: 400 });
    }
    updatePayload.name = name;
  }

  if (typeof body.isAdmin === 'boolean') {
    updatePayload.isAdmin = body.isAdmin;
  }

  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 });
    }
    updatePayload.password = await hashPassword(body.password);
  }

  const updated = await db.update(usersTable).set(updatePayload).where(eq(usersTable.id, userId)).returning({
    id: usersTable.id,
    name: usersTable.name,
    isAdmin: usersTable.isAdmin,
    createdAt: usersTable.createdAt,
    updatedAt: usersTable.updatedAt,
  });

  if (!updated[0]) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json({ data: updated[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const resolvedParams = await params;
  const userId = parseId(resolvedParams.id);
  if (!userId) {
    return NextResponse.json({ error: '无效用户ID' }, { status: 400 });
  }

  const users = await db.select({ id: usersTable.id }).from(usersTable);
  if (users.length <= 1) {
    return NextResponse.json({ error: '至少保留一个用户' }, { status: 400 });
  }

  const deleted = await db
    .delete(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.id, auth.session.userId)))
    .returning({ id: usersTable.id });

  if (deleted[0]) {
    return NextResponse.json({ error: '不能删除当前登录用户' }, { status: 400 });
  }

  const targetDeleted = await db.delete(usersTable).where(eq(usersTable.id, userId)).returning({ id: usersTable.id });
  if (!targetDeleted[0]) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
