import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { usersTable } from '@/server/db/schema';
import { hashPassword } from '@/server/utils/auth';
import { requireAdmin } from '@/server/utils/require-admin';

type CreateUserBody = {
  name?: unknown;
  password?: unknown;
  isAdmin?: unknown;
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .orderBy(asc(usersTable.id));

  return NextResponse.json({ data: users });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = (await request.json()) as CreateUserBody;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const isAdmin = body.isAdmin === true;

  if (name.length < 2 || name.length > 50) {
    return NextResponse.json({ error: '用户名长度必须在 2-50 之间' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  const created = await db
    .insert(usersTable)
    .values({
      name,
      password: hashed,
      isAdmin,
      isVip: false,
      updatedAt: new Date(),
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    });

  return NextResponse.json({ data: created[0] });
}
