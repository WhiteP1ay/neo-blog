import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

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
    const pool = new Pool({
      connectionString: databaseUrl,
      // 连接池配置
      max: 10, // 最大连接数
      idleTimeoutMillis: 30000, // 空闲连接超时时间
      connectionTimeoutMillis: 5000, // 连接超时时间（5秒）
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
