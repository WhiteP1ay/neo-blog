/**
 * 环境变量类型定义
 * 这样可以在 TypeScript 中获得类型提示和自动补全
 */

namespace NodeJS {
  interface ProcessEnv {
    // Node 环境
    NODE_ENV: 'development' | 'production' | 'test';
    
    // 数据库配置
    DATABASE_URL?: string;
    POSTGRES_PASSWORD?: string;
    
    // API 配置（服务端）
    API_URL?: string;
    SECRET_KEY?: string;
    JWT_SECRET?: string;
    
    // 功能开关
    ENABLE_DEBUG?: 'true' | 'false';
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
    
    // 客户端可访问的环境变量（必须以 NEXT_PUBLIC_ 开头）
    NEXT_PUBLIC_APP_NAME?: string;
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_API_URL?: string;
    
    // 其他环境变量
    APP_VERSION?: string;
    
    // 添加更多环境变量定义...
  }
}

export {};

