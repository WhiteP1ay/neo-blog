import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { usersTable } from '@/server/db/schema';
import { hashPassword } from '@/server/utils/auth';

/**
 * 从环境变量读取管理员初始化信息。
 */
function readAdminEnv() {
  const name = (process.env.ADMIN_NAME ?? '').trim();
  const password = process.env.ADMIN_PASSWORD ?? '';

  if (name.length < 2 || name.length > 50) {
    throw new Error('ADMIN_NAME 长度必须在 2-50 之间');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD 至少 8 位');
  }
  return { name, password };
}

/**
 * 初始化第一个管理员。
 */
async function seedAdmin() {
  const { name, password } = readAdminEnv();
  const existingAdmin = await db.query.usersTable.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.isAdmin, true),
  });

  if (existingAdmin) {
    console.log(`ℹ️ 已存在管理员：${existingAdmin.name}，跳过初始化`);
    return;
  }

  const existingUser = await db.query.usersTable.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.name, name),
  });
  if (existingUser) {
    await db
      .update(usersTable)
      .set({
        isAdmin: true,
        password: await hashPassword(password),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, existingUser.id));
    console.log(`✅ 用户 ${name} 已升级为管理员`);
    return;
  }

  await db.insert(usersTable).values({
    name,
    password: await hashPassword(password),
    isAdmin: true,
    isVip: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`✅ 初始化管理员成功：${name}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ seed-admin 失败:', message);
    process.exit(1);
  });
