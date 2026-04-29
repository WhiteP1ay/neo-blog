import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { and, eq, max } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { explorerNodesTable, usersTable } from '@/server/db/schema';

const ROOT_NAME = '根目录';
const ROOT_CODE = 'root';
const EXTERNAL_POSTS_ROOT_CODE = 'external_posts_root';
const EXTERNAL_PHOTOS_ROOT_CODE = 'external_photos_root';

/**
 * 读取初始化管理员账号名。
 *
 * 优先级：
 * 1. INIT_ADMIN_NAME
 * 2. ADMIN_NAME
 */
function getInitAdminName(): string {
  const raw = process.env.INIT_ADMIN_NAME ?? process.env.ADMIN_NAME;
  if (!raw) {
    throw new Error('缺少环境变量 INIT_ADMIN_NAME（或 ADMIN_NAME）');
  }
  const value = raw.trim();
  if (value.length < 2 || value.length > 50) {
    throw new Error('管理员用户名长度必须在 2-50 之间');
  }
  return value;
}

/**
 * 读取初始化管理员密码。
 *
 * 优先级：
 * 1. INIT_ADMIN_PASSWORD
 * 2. ADMIN_PASSWORD
 */
function getInitAdminPassword(): string {
  const raw = process.env.INIT_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!raw) {
    throw new Error('缺少环境变量 INIT_ADMIN_PASSWORD（或 ADMIN_PASSWORD）');
  }
  const value = raw.trim();
  if (value.length < 8) {
    throw new Error('管理员密码长度至少 8 位');
  }
  return value;
}

/**
 * 查找并确保系统根目录存在。
 */
async function ensureRootNode() {
  const existing = await db.query.explorerNodesTable.findFirst({
    where: (n, { and: andFn, eq: eqFn, isNull: isNullFn }) =>
      andFn(eqFn(n.nodeType, 'folder'), isNullFn(n.parentId), eqFn(n.code, ROOT_CODE)),
  });
  if (existing) return existing;

  const fallback = await db.query.explorerNodesTable.findFirst({
    where: (n, { and: andFn, eq: eqFn, isNull: isNullFn }) =>
      andFn(eqFn(n.nodeType, 'folder'), isNullFn(n.parentId), eqFn(n.name, ROOT_NAME)),
  });
  if (fallback) {
    const rows = await db
      .update(explorerNodesTable)
      .set({ code: ROOT_CODE, updatedAt: new Date() })
      .where(eq(explorerNodesTable.id, fallback.id))
      .returning();
    return rows[0];
  }

  const rows = await db
    .insert(explorerNodesTable)
    .values({
      parentId: null,
      code: ROOT_CODE,
      name: ROOT_NAME,
      nodeType: 'folder',
      sortOrder: 0,
    })
    .returning();
  return rows[0];
}

/**
 * 在指定父目录下确保系统目录存在。
 */
async function ensureSystemFolder(parentId: number, code: string, name: string) {
  const existing = await db.query.explorerNodesTable.findFirst({
    where: and(eq(explorerNodesTable.code, code), eq(explorerNodesTable.nodeType, 'folder')),
  });
  if (existing) return existing;

  const maxRow = await db
    .select({ m: max(explorerNodesTable.sortOrder) })
    .from(explorerNodesTable)
    .where(eq(explorerNodesTable.parentId, parentId));

  const nextSort = (maxRow[0]?.m ?? -1) + 1;
  const rows = await db
    .insert(explorerNodesTable)
    .values({
      parentId,
      code,
      name,
      nodeType: 'folder',
      sortOrder: nextSort,
    })
    .returning();
  return rows[0];
}

/**
 * 以幂等方式确保系统目录存在。
 */
async function ensureSystemNodes() {
  const root = await ensureRootNode();
  const postsRoot = await ensureSystemFolder(root.id, EXTERNAL_POSTS_ROOT_CODE, '外部文章');
  const photosRoot = await ensureSystemFolder(root.id, EXTERNAL_PHOTOS_ROOT_CODE, '外部图片');
  return { root, postsRoot, photosRoot };
}

/**
 * 以幂等方式确保管理员账户存在：
 * - 用户存在且不是管理员：升级为管理员
 * - 用户不存在：创建管理员
 */
async function ensureAdminUser(adminName: string, adminPassword: string) {
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.name, adminName),
  });

  if (existing) {
    if (!existing.isAdmin) {
      await db
        .update(usersTable)
        .set({ isAdmin: true, updatedAt: new Date() })
        .where(eq(usersTable.id, existing.id));
      console.log(`✅ 用户 ${adminName} 已升级为管理员`);
      return;
    }
    console.log(`ℹ️ 管理员 ${adminName} 已存在，跳过创建`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await db.insert(usersTable).values({
    name: adminName,
    password: hashedPassword,
    isAdmin: true,
    isVip: false,
  });
  console.log(`✅ 管理员 ${adminName} 初始化完成`);
}

/**
 * 系统初始化入口：
 * 1) 系统目录
 * 2) 管理员账户
 */
async function bootstrap(): Promise<void> {
  const adminName = getInitAdminName();
  const adminPassword = getInitAdminPassword();
  await ensureSystemNodes();
  await ensureAdminUser(adminName, adminPassword);
}

bootstrap()
  .then(() => {
    console.log('✅ 系统初始化完成');
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ 系统初始化失败:', message);
    process.exit(1);
  });
