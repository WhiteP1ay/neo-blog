# base-config 仓库需配合的变更（zhparser 搜索）

Cloud Agent **无法访问** 私有仓库 `base-config`。请在本地 `base-config` 中按下列项修改，使生产/编排环境与 neo-blog 的 zhparser 迁移一致。

## 1. PostgreSQL 镜像

将生产或 compose 中的 Postgres 从官方 `postgres` 换为 **带 zhparser 的镜像**，任选其一：

### 方案 A：使用 neo-blog 仓库内 Dockerfile 构建

在 `base-config` 的 compose / stack 中引用 neo-blog 构建产物，例如：

```yaml
db:
  image: your-registry/neo-blog-postgres:16-zhparser
  # 或 build:
  #   context: https://github.com/<you>/neo-blog.git#main:docker/postgres
```

在 CI 中增加构建并推送 `docker/postgres` 的步骤（可与 neo-blog 同 pipeline，或单独 job）。

### 方案 B：在 base-config 内复制 Dockerfile

将 neo-blog 的 `docker/postgres/` 目录复制到 base-config，并在现有 stack 里 `build: ./docker/postgres`。

## 2. 首次部署 / 升级顺序

1. **备份** 生产数据库。
2. 部署新 Postgres 镜像（新实例或原地升级需自行评估；推荐新容器 + 数据卷迁移）。
3. 在库中确认扩展（Adminer 或 `psql`）：
   ```sql
   \dx
   SELECT * FROM pg_ts_config WHERE cfgname = 'chinese';
   ```
4. 执行 neo-blog 迁移：`drizzle-kit migrate` 或 `0006_post_search_zhparser.sql`。
5. 运行回填：`pnpm db:reindex-search`（在能连生产库的环境，或 K8s Job）。
6. 部署新版 neo-blog 应用镜像。

## 3. 环境变量

无需新增应用环境变量；仍使用 `DATABASE_URL`。

若 base-config 中 Postgres 服务名/端口变化，只需保证 neo-blog 容器的 `DATABASE_URL` 指向带 zhparser 的实例。

## 4. 云托管 RDS

若 base-config 使用 **阿里云/腾讯云 RDS 等托管 Postgres**，通常 **无法** 安装 zhparser。此时应：

- 改为自建 Postgres 容器（compose/k8s），或
- 回退 neo-blog 到方案 A（应用层 nodejieba），不要应用 `0006` 迁移。

## 5. 检查清单

- [ ] Postgres 镜像含 `zhparser` 扩展
- [ ] 存在 text search configuration `chinese`
- [ ] `posts` 表有 `plainBody`、`searchVector` 及 GIN 索引
- [ ] 历史文章已执行 `pnpm db:reindex-search`
- [ ] 新文章上传/更新后搜索可用

## 6. 回滚

- 应用：回滚 neo-blog 镜像到上一版本（搜索接口不可用，列表仍正常）。
- 数据库：`plainBody` / `searchVector` 列可保留；若需移除，单独写 down migration。
