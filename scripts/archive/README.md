# 一次性 / 高风险脚本归档

本目录存放**不应通过 `package.json` 日常脚本误触**的历史迁移或破坏性工具。仍在使用的初始化与维护脚本保留在 [`../`](../)（仓库根下 `scripts/`）。

## 仍留在 `scripts/` 的脚本（摘要）

| 文件 | 用途 |
|------|------|
| `seed-admin.ts` | 新环境初始化管理员 |
| `gen-pwa-brand-icons.mjs` | PWA 图标生成 |
| `db-latency.ts` | 数据库延迟诊断 |
| `backfill-post-h1.ts` | 历史正文 H1 回填（仍可能对导入数据有用） |
| `strip-post-title-type-prefixes.ts` | 标题/首 H1 前缀清洗（可重复执行，带 dry-run） |

## 本目录脚本

| 文件 | 说明 | 是否假定已执行 |
|------|------|----------------|
| `migrate-bilingual-post-columns.ts` | 旧版中英混排正文迁移到 `contentEn` 等列 | 生产/主库通常已执行；**勿对新空库无意义重跑** |
| `clean-posts-table.ts` | 大批量改库 + 调用 DeepSeek，**高风险** | 按需手动执行；务必先 `--dry-run` |

### 手动执行示例

```bash
# 仅当确认需要重放历史迁移时
pnpm tsx scripts/archive/migrate-bilingual-post-columns.ts

# 清洗脚本务必先 dry-run
pnpm tsx scripts/archive/clean-posts-table.ts --dry-run
```
