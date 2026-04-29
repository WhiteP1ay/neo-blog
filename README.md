# Neo Blog

一套支持文件后台管理、实现访问统计的极简博客系统。

```bash
# 1) 推送 Drizzle 迁移到 Supabase
pnpm drizzle-kit push

# 2) 检查核心表是否存在
psql "$DATABASE_URL" -c "\dt"
```

如果 `psql` 输出中可见 `posts` / `comments` / `users` / `analytics`，说明迁移成功。

## 初始化数据库

```bash
# 运行数据库迁移
pnpm drizzle-kit push
# 或
npx drizzle-kit push
```

1. **执行系统初始化（系统目录 + 管理员账户）**

```bash
# 先在 .env 中配置 INIT_ADMIN_NAME / INIT_ADMIN_PASSWORD
# 也兼容 ADMIN_NAME / ADMIN_PASSWORD
pnpm db:bootstrap
```

也可以直接一键执行“迁移 + 系统初始化”：

```bash
pnpm db:init
```

## 构建镜像

```bash
# 构建并推送
./build-and-push.sh neo-blog latest docker.io/你的用户名

# 或手动构建
docker build -t neo-blog:latest .
```

### 推送镜像到远程仓库

```bash
# 推送到 Docker Hub
./build-and-push.sh neo-blog latest docker.io/你的用户名

# 推送到私有仓库
./build-and-push.sh neo-blog v1.0.0 registry.example.com
```

### 运行容器

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://用户名:密码@数据库地址:5432/数据库名 \
  neo-blog:latest

# test image on local
docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgresql://example:example@localhost:5432/neo_blog \
  --name neo-blog \
  neo-blog:latest
```

### GitHub Actions 自动部署

项目包含 GitHub Actions 工作流，当 push 到 `deploy` 分支时会自动构建并推送镜像到 Docker Hub。

#### 配置步骤

1. **在 GitHub 仓库中配置 Secrets**：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 添加以下两个 secrets：
     - `DOCKERHUB_USERNAME`: 你的 Docker Hub 用户名
     - `DOCKERHUB_TOKEN`: 你的 Docker Hub Access Token（在 Docker Hub → Account Settings → Security 中创建）

2. **使用方式**：

   ```bash
   # 切换到 deploy 分支
   git checkout deploy
   
   # 或者创建并切换到 deploy 分支
   git checkout -b deploy
   
   # 推送代码，触发自动构建
   git push origin deploy
   ```

3. **镜像标签**：
   - `latest`: 最新版本（deploy 分支）
   - `deploy`: deploy 分支标签
   - `deploy-<commit-sha>`: 包含 commit SHA 的标签

工作流文件位置：`.github/workflows/deploy.yml`

## 🔧 开发

### 数据库迁移

```bash
# 生成迁移文件
yarn drizzle-kit generate

# 应用迁移
yarn drizzle-kit push

```
