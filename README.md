# Neo Blog

一套支持文件后台管理、实现访问统计的极简博客系统。

## ✨ 特性

- 📝 **Markdown 文件上传** - 支持拖拽或点击上传 `.md` 文件，自动解析并发布文章
- 📊 **访问统计** - 完整的 PV（页面浏览量）和 UV（独立访客数）统计功能
- 💬 **评论系统** - 支持嵌套的文章评论
- 🎨 **极简设计** - 清爽简洁的界面，专注于内容展示
- 🔐 **后台管理** - 附带有文章管理和数据统计后台
- 📱 **响应式设计** - 适配桌面和移动设备

## 📦 安装

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd neo-blog
```

2. **安装依赖**

```bash
yarn install
# 或
npm install
```

3. **配置环境变量**

数据库连接方式基于 DATABASE_URL

```env
# 数据库连接（格式: postgresql://用户名:密码@主机:端口/数据库名）
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/neo_blog
```

**注意**：如果使用 `compose.yml` 启动数据库，还需要以下环境变量用于 PostgreSQL 容器配置：

```env
DATABASE_URL=postgresql://postgres:example@localhost:5432/neo_blog

POSTGRES_USER=postgres
POSTGRES_PASSWORD=example
POSTGRES_DB=neo_blog
```

4. **初始化数据库**

```bash
# 运行数据库迁移
yarn drizzle-kit push
# 或
npx drizzle-kit push
```

5. **创建管理员账户**

首次使用需要手动在数据库中创建管理员账户，或通过数据库管理工具（如 Adminer）创建。

6. **启动开发服务器**

```bash
yarn dev
# 或
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

项目包含 `compose.yml` 文件，可以快速启动数据库和管理工具：

```bash
docker compose up -d
```

### 构建镜像

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

## 📖 使用指南

### 后台管理

1. 访问 `/login` 登录管理后台
2. 登录后进入 `/admin` 管理页面

### 文章管理

- 在管理后台直接拖拽或点击上传 `.md` 文件
- 系统会自动从文件名或文件第一行的 `# 标题` 提取标题
- Markdown 内容被保存
- 文章内容被转换成 html 并保存
- 支持下载 Markdown
- 修改内容仅支持重新上传
- 文章的评论可以管理

### 访问统计

- 在管理后台的"统计"标签页查看：
  - 总 PV（页面浏览量）
  - 总 UV（独立访客数）
  - 每日统计数据
  - 热门文章排行
  - 事件类型统计

## 📁 项目结构

```
neo-blog/
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 管理后台
│   ├── api/               # API 路由
│   ├── components/        # 公共组件
│   └── [id]/              # 文章详情页
├── server/                # 服务端代码
│   ├── actions/           # Server Actions
│   ├── db/                # 数据库配置
│   └── utils/             # 工具函数
├── drizzle/               # 数据库迁移文件
├── Dockerfile             # Docker 镜像构建文件
├── compose.yml            # Docker Compose 配置
└── build-and-push.sh      # 构建和推送脚本
```

## 🔧 开发

### 数据库迁移

```bash
# 生成迁移文件
yarn drizzle-kit generate

# 应用迁移
yarn drizzle-kit push

# 查看数据库（使用 Adminer）
# 访问 http://localhost:8080
```
