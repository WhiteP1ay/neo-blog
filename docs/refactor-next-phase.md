# 重构阶段说明（一期 / 二期 / 三期）

本文档跟踪站点与管理端的重构阶段目标。

---

## 一期（已完成）

- 中文首页迁入 `app/(site)/page.tsx`，与 `app/(site)/layout.tsx` 统一外壳；移除重复 `SiteShell`。
- 博文列表/详情中英文路由薄化，共享逻辑在 `lib/app-pages/site-blog-pages.ts`。
- `getPostById(id, false)` 使用 `React.cache` 去重同请求内多次读库。
- 管理端统一 JSON 解析 `lib/admin-json.ts`；博文分类拖拽、多类删除采用乐观更新。

---

## 二期（已完成）

### Admin 数据层与交互

- **列表查询拆分**：`hooks/admin/useAdminConsoleQueries.ts` 承载五路 `useQueries` + 水合安全 `enabled`；`useAdminConsole` 只负责表单与 mutation。
- **写操作精准失效**：移除 `refreshAll()` 热点；各创建/更新仅失效对应 `queryKey`。
- **乐观更新扩展**：`togglePostHidden`、`togglePhotoHidden`、`createComment` 等。
- **首页精选**：`useHomeFeatured` 改用 `parseAdminJsonResponse`。

### 前台 i18n / SEO

- **About**：`AboutPageContent` 按 `locale` 分文案；`/about` 与 `/en/about` 分别传入。
- **英文子树**：`app/(site)/en/layout.tsx` 使用 `display: contents` + `lang="en"`。

### 工程卫生

- `package.json` 增加 `db:strip-title-prefixes`。
- 修正冗余 import：`app/api/admin/post-types/route.ts`、`app/api/posts/route.ts`。

---

## 三期（已完成）

### Admin 架构

- **Mutation 抽离**：[`hooks/admin/useAdminConsoleMutations.ts`](hooks/admin/useAdminConsoleMutations.ts) 集中博文/用户/照片/评论的 mutation；[`useAdminConsole.ts`](components/admin/console/useAdminConsole.ts) 仅保留 Tab、表单 state、拉详情与 Markdown 上传等编排逻辑。
- **创建类乐观插入**：新建用户、新建照片、上传照片在 `onSuccess` 中前置写入对应列表缓存；`onSettled` 仍 `invalidate` 对齐服务端。
- **创建失败 UX**：`createUser` / `createPhoto` / `uploadPhotoFile` / `createComment` 用 `try/catch` 承接 `mutateAsync` 抛错（错误 toast 在 mutation 内）。

### 首页精选

- **`setFeatured` 乐观更新**：[`useHomeFeatured.ts`](components/admin/console/home/useHomeFeatured.ts) 中 `addFeatured` / `removeFeatured` 在 `onMutate` 更新 `['admin','home','featured']`（加入时从 `['admin','posts']` 拼行；无博文缓存则跳过乐观加入）；`onError` 回滚；`onSettled` 刷新精选与博文列表。

### Lint / 类型

- **AiPolish 预览应用**：[`AiPolishPreviewClient.tsx`](components/admin/posts/AiPolishPreviewClient.tsx) 中 `handleApply` 的 `useCallback` 依赖补充为 `state.status === 'ready' ? state.payload.afterHtmlEn : null`，满足 exhaustive-deps 且通过联合类型收窄。

---

## 四期（建议 backlog）

### 1. 根布局语言

- 若需服务端即正确的 `<html lang>` 随路由变化，可评估 middleware 或 Next 官方推荐方案（当前 `en/layout` 的 `div[lang=en]` 已覆盖多数场景）。

### 2. 目录结构

- 稳定后再考虑 `features/blog`、`features/admin` 等迁移与批量 import 更新。

### 3. 其余 a11y / Biome

- 全仓 `pnpm lint` 中零散告警（如个别语义元素建议）按需清理。

### 4. 一次性脚本归档与 E2E

- 历史迁移类脚本集中在 [`scripts/archive/`](../scripts/archive/)，索引与警告见 [`scripts/archive/README.md`](../scripts/archive/README.md)；避免在新环境误跑已归档迁移。
- 可重复 E2E 使用 `@playwright/test`：`pnpm test:e2e`；环境变量与 CI 说明见 [`e2e/README.md`](../e2e/README.md)。

---

更新说明：重大架构决策可另写 ADR；本文件随迭代更新「阶段边界」即可。
