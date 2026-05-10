import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';

/**
 * c 端阅读页已不再单独渲染文章标题，正文里 h1 即标题。
 * 此脚本扫描所有文章，给「正文开头没有 h1」的文章自动补一个 h1：
 *   - title 已经形如 `【xxx】...` → 直接用 title 作为 h1 文本
 *   - 否则若 type 非空 → 拼成 `【{type}】{title}` 作为 h1（兼容全屏编辑器从 h1 解析 type）
 *   - 否则 → 直接用 title
 *
 * 默认 dry-run：仅打印将要修改的列表，不写库。
 * 加上 `--apply` 才会真正 UPDATE 数据库。
 * 可选 `--id <postId>` 仅处理指定 id（便于回归单条）。
 *
 * 用法：
 *   pnpm tsx scripts/backfill-post-h1.ts             # dry-run，全量
 *   pnpm tsx scripts/backfill-post-h1.ts --apply     # 全量写库
 *   pnpm tsx scripts/backfill-post-h1.ts --id 12     # dry-run 单条
 */

const HAS_LEADING_H1_RE = /^\s*<h1[\s>]/i;
const TITLE_HAS_TYPE_PREFIX_RE = /^【[^】]+】/;

type Mode = { apply: boolean; onlyId: number | null };

function parseArgs(argv: string[]): Mode {
  const mode: Mode = { apply: false, onlyId: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      mode.apply = true;
      continue;
    }
    if (arg === '--id') {
      const value = argv[i + 1];
      const id = Number.parseInt(value ?? '', 10);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('--id 后必须跟正整数');
      }
      mode.onlyId = id;
      i += 1;
      continue;
    }
    throw new Error(`未知参数：${arg}`);
  }
  return mode;
}

/**
 * 转义 HTML 文本节点，防止 title 里含 & < > 时破坏文档结构。
 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    return '&gt;';
  });
}

/**
 * 推断要插入的 h1 文本：
 * - title 已含 【】 前缀 → 直接用
 * - type 非空 → 拼成 【type】title
 * - 否则 → 直接 title
 */
function buildH1Text(title: string, type: string): string {
  const trimmedTitle = title.trim();
  if (TITLE_HAS_TYPE_PREFIX_RE.test(trimmedTitle)) {
    return trimmedTitle;
  }
  const trimmedType = type.trim();
  if (trimmedType) {
    return `【${trimmedType}】${trimmedTitle}`;
  }
  return trimmedTitle;
}

/**
 * 在 content 最前面 prepend 一个 h1。直接做字符串拼接，
 * 避免 cheerio.load 引入额外的结构变化（如自动补全 tbody 等）。
 */
function prependH1(content: string, h1Text: string): string {
  return `<h1>${escapeHtml(h1Text)}</h1>\n${content}`;
}

async function main() {
  const mode = parseArgs(process.argv.slice(2));

  const rows = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      type: postsTable.type,
      content: postsTable.content,
    })
    .from(postsTable);

  const targets = mode.onlyId === null ? rows : rows.filter((row) => row.id === mode.onlyId);
  if (targets.length === 0) {
    console.log('⚠️ 未找到任何匹配文章，请检查 --id 或数据库连接');
    return;
  }

  let toUpdate = 0;
  let skipped = 0;

  for (const row of targets) {
    const hasH1 = HAS_LEADING_H1_RE.test(row.content);
    if (hasH1) {
      skipped += 1;
      continue;
    }
    toUpdate += 1;
    const h1Text = buildH1Text(row.title, row.type);
    const nextContent = prependH1(row.content, h1Text);

    console.log(`#${row.id}  title="${row.title}"  type="${row.type}"`);
    console.log(`  → 将插入 h1：「${h1Text}」`);

    if (mode.apply) {
      await db.update(postsTable).set({ content: nextContent }).where(eq(postsTable.id, row.id));
    }
  }

  const verb = mode.apply ? '已写库' : '将更新';
  console.log('\n──────────');
  console.log(`扫描 ${targets.length} 篇，${verb} ${toUpdate} 篇，已含 h1 跳过 ${skipped} 篇`);
  if (!mode.apply && toUpdate > 0) {
    console.log('当前为 dry-run。确认无误后加 `--apply` 真正落库。');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ backfill-post-h1 失败:', message);
    process.exit(1);
  });
