import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type RuntimeEnv = 'development' | 'test' | 'production';

/**
 * 解析正整数环境变量，解析失败时回退到默认值。
 */
function parsePositiveIntEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    console.warn(`⚠️ 环境变量 ${name}=${rawValue} 无效，已回退默认值 ${fallback}`);
    return fallback;
  }
  return parsedValue;
}

/**
 * 判断当前是否为生产环境。
 */
function isProductionEnv(): boolean {
  return (process.env.NODE_ENV as RuntimeEnv | undefined) === 'production';
}

/**
 * 根据环境变量解析 SSL 策略。
 */
function resolveSslConfig():
  | false
  | {
      rejectUnauthorized: boolean;
    } {
  const forceDisableSsl = process.env.DB_SSL_DISABLE === 'true';
  if (forceDisableSsl) {
    return false;
  }

  const forceEnableSsl = process.env.DB_SSL === 'true';
  if (forceEnableSsl || isProductionEnv()) {
    // Supabase 推荐使用 SSL，云环境默认启用且放宽证书校验以降低连接失败概率。
    return { rejectUnauthorized: false };
  }

  return false;
}

/**
 * 打印数据库连接错误详情
 */
function printConnectionError(
  err: Error & {
    code?: string;
    host?: string;
    port?: number;
    database?: string;
  },
) {
  const databaseUrl = process.env.DATABASE_URL || '';
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');

  console.error('❌ 数据库连接失败:');
  console.error('   错误信息:', err.message);
  console.error('   连接字符串:', maskedUrl);

  if (err.code) {
    console.error('   错误代码:', err.code);
    // 常见错误代码说明
    const errorMessages: Record<string, string> = {
      ECONNREFUSED: '连接被拒绝，请检查数据库服务是否启动',
      ETIMEDOUT: '连接超时，请检查网络和防火墙设置',
      ENOTFOUND: '无法解析主机名，请检查 DATABASE_URL 中的主机地址',
      '28P01': '身份验证失败，请检查用户名和密码',
      '3D000': '数据库不存在，请先创建数据库',
      '57P03': '数据库正在启动中，请稍后重试',
      '53300': '连接数已满，请降低连接池大小或使用 Supabase Pooler 连接串',
      XX000: '可能是 SSL 或网络中断问题，请检查 Supabase 连接串和 SSL 配置',
    };
    if (errorMessages[err.code]) {
      console.error('   说明:', errorMessages[err.code]);
    }
  }

  if (err.host) {
    console.error('   主机地址:', err.host);
  }
  if (err.port) {
    console.error('   端口:', err.port);
  }
  if (err.database) {
    console.error('   数据库名:', err.database);
  }
}

/**
 * 创建数据库连接池
 */
function createDatabasePool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ 数据库连接失败: DATABASE_URL 环境变量未设置');
    throw new Error('DATABASE_URL 环境变量未设置');
  }

  try {
    const maxConnections = parsePositiveIntEnv('DB_POOL_MAX', 5);
    const idleTimeoutMillis = parsePositiveIntEnv('DB_IDLE_TIMEOUT_MS', 30000);
    const connectionTimeoutMillis = parsePositiveIntEnv('DB_CONNECT_TIMEOUT_MS', 10000);
    const ssl = resolveSslConfig();

    const pool = new Pool({
      connectionString: databaseUrl,
      // Supabase / Serverless 友好的连接池配置，可通过环境变量覆盖。
      max: maxConnections,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      ssl,
    });

    // 监听连接池错误
    pool.on('error', (err) => {
      console.error('❌ 数据库连接池错误:');
      printConnectionError(err);
    });

    // 异步测试连接（不阻塞模块加载）
    pool
      .connect()
      .then((client) => {
        console.log('✅ 数据库连接成功');
        client.release();
      })
      .catch((err) => {
        printConnectionError(err);
      });

    return pool;
  } catch (error) {
    console.error('❌ 创建数据库连接池失败:');
    if (error instanceof Error) {
      printConnectionError(error);
    } else {
      console.error('   未知错误:', error);
    }
    throw error;
  }
}

// 创建连接池
const pool = createDatabasePool();

// 导出 drizzle 实例
export const db = drizzle(pool, { schema });
