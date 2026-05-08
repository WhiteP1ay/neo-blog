# 使用官方 Node.js 运行时作为基础镜像
FROM node:22-alpine AS base

# 启用 pnpm（corepack 会自动匹配 lockfile 中的版本）
RUN corepack enable

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
# 构建时提供一个假的 DATABASE_URL，避免构建失败
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

# 构建 Next.js 应用
RUN pnpm build

# 生产镜像阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 复制 public 文件夹（standalone 模式不会自动包含）
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
