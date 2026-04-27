import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { usersTable } from '@/server/db/schema';

/**
 * 读取并校验必填字符串环境变量。
 */
function getRequiredEnv(name: 'ADMIN_NAME' | 'ADMIN_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    throw new Error(`环境变量 ${name} 不能为空字符串`);
  }
  return trimmedValue;
}

/**
 * 校验管理员凭证是否合法，避免写入无效数据。
 */
function validateAdminCredentials(username: string, password: string): void {
  // 约束用户名长度，防止异常输入破坏后台登录体验。
  if (username.length < 2 || username.length > 50) {
    throw new Error('ADMIN_NAME 长度必须在 2-50 之间');
  }

  // 约束密码强度，至少 8 位，避免弱口令。
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD 至少需要 8 位');
  }
}

/**
 * 以幂等方式初始化管理员：
 * - 已存在同名用户：跳过
 * - 不存在：创建管理员并加密密码
 */
async function seedAdmin(): Promise<void> {
  const adminName = getRequiredEnv('ADMIN_NAME');
  const adminPassword = getRequiredEnv('ADMIN_PASSWORD');
  validateAdminCredentials(adminName, adminPassword);

  const existedUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.name, adminName),
  });

  if (existedUser) {
    console.log(`ℹ️ 管理员 ${adminName} 已存在，跳过创建`);
    return;
  }

  // 使用 bcrypt 对密码做哈希，避免明文入库。
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await db.insert(usersTable).values({
    name: adminName,
    password: hashedPassword,
    isAdmin: true,
    isVip: false,
  });

  console.log(`✅ 管理员 ${adminName} 初始化完成`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ 管理员初始化失败:', message);
    process.exit(1);
  });
