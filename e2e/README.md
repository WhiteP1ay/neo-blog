# E2E（Playwright）

本目录使用 [`@playwright/test`](https://playwright.dev/) 做可重复执行的端到端测试。配置见根目录 [`playwright.config.ts`](../playwright.config.ts)：`webServer` 会启动 `pnpm dev`，`baseURL` 默认 `http://127.0.0.1:3000`。

**与「playwright-cli」/ Cursor 浏览器 MCP 的区别**：后者适合交互探索；CI 与本地回归请用本仓库的 `pnpm test:e2e`。

## 环境变量

| 变量 | 说明 |
|------|------|
| `PLAYWRIGHT_BASE_URL` | 可选。被测站点根地址；未设置时与配置默认一致（`127.0.0.1:3000`）。 |
| `E2E_ADMIN_USER` | 管理员登录用户名（与前台 `/login` 表单一致）。 |
| `E2E_ADMIN_PASSWORD` | 管理员密码。 |

本地可把上述变量写在仓库根目录的 `.env` 或 `.env.local`：`playwright.config.ts` 会在启动测试前用 `dotenv` 加载（与 Next 类似，`.env.local` 覆盖 `.env`）。仅导出到 shell、未写文件时也会生效。

未设置 `E2E_ADMIN_USER` / `E2E_ADMIN_PASSWORD` 时，`setup` 仍会写入空的 `playwright/.auth/admin.json`，**Admin 用例会整体跳过**（避免 fork/CI 无密钥时裸失败）。

## 本地运行

首次在本机安装浏览器（任选其一）：

```bash
pnpm exec playwright install chromium
```

运行全部 E2E（含 setup、C 端、Admin）：

```bash
pnpm test:e2e
```

仅跑前台（不依赖管理员凭据）：

```bash
pnpm test:e2e --project=setup --project=site
```

调试 UI：

```bash
pnpm test:e2e:ui
```

E2E 会连 `.env` 中的数据库；请保证本地库可读写且已有博文数据，否则部分用例会 `skip` 或失败。

## CI（参考）

1. 在 CI 中配置 `E2E_ADMIN_USER`、`E2E_ADMIN_PASSWORD`（例如 GitHub Actions Secrets）。
2. 安装浏览器：`pnpm exec playwright install --with-deps`（按 Runner 系统选择是否加 `--with-deps`）。
3. 执行：`pnpm test:e2e`（或 `CI=true` 下由配置收紧 `forbidOnly`/重试等）。

报告与产物目录（已在 `.gitignore`）：`playwright-report/`、`test-results/`、`blob-report/`、`playwright/.auth/`。
