import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';
import { stripLeadingDecorationsFromFirstH1InHtml } from '@/server/utils/post-ai-translation-html';

/**
 * 扫描每篇文章：
 * - `posts.title`、`posts.titleEn`：去掉开头的 `【…】`、`[…]`
 * - `posts.content`、`posts.contentEn`：**第一个** `<h1>` 可见文本去掉同类前缀（保留 H1 内其它 HTML，如双语提示 span）
 *
 * 默认 dry-run；`--apply` 写库；`--id <postId>` 只处理一条。
 * 标题剥空则跳过该字段；正文剥空则跳过正文更新。
 *
 * 用法：
 *   pnpm tsx scripts/strip-post-title-type-prefixes.ts
 *   pnpm tsx scripts/strip-post-title-type-prefixes.ts --apply
 */

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

async function main() {
  const mode = parseArgs(process.argv.slice(2));

  const rows = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      titleEn: postsTable.titleEn,
      content: postsTable.content,
      contentEn: postsTable.contentEn,
    })
    .from(postsTable);

  const targets = mode.onlyId === null ? rows : rows.filter((r) => r.id === mode.onlyId);
  if (targets.length === 0) {
    console.log('未找到匹配文章。');
    return;
  }

  let wouldUpdate = 0;
  let applied = 0;
  let warnTitle = 0;
  let warnTitleEn = 0;

  for (const row of targets) {
    const setPayload: {
      title?: string;
      titleEn?: string | null;
      content?: string;
      contentEn?: string | null;
    } = {};

    const nextTitle = stripLeadingTypeLikePrefixes(row.title);
    if (nextTitle !== row.title) {
      if (nextTitle.length === 0) {
        console.warn(`[跳过 title] id=${row.id} 去掉前缀后为空，保留原值。`);
        warnTitle += 1;
      } else {
        setPayload.title = nextTitle;
      }
    }

    const enRaw = row.titleEn?.trim();
    if (enRaw) {
      const nextEn = stripLeadingTypeLikePrefixes(enRaw);
      if (nextEn !== enRaw) {
        if (nextEn.length === 0) {
          console.warn(`[跳过 titleEn] id=${row.id} 去掉前缀后为空，保留原值。`);
          warnTitleEn += 1;
        } else {
          setPayload.titleEn = nextEn;
        }
      }
    }

    const nextContent = stripLeadingDecorationsFromFirstH1InHtml(row.content);
    if (nextContent !== row.content) {
      setPayload.content = nextContent;
    }

    if (row.contentEn?.trim()) {
      const nextCe = stripLeadingDecorationsFromFirstH1InHtml(row.contentEn);
      if (nextCe !== row.contentEn) {
        setPayload.contentEn = nextCe;
      }
    }

    if (Object.keys(setPayload).length === 0) {
      continue;
    }

    wouldUpdate += 1;
    const log: Record<string, unknown> = { id: row.id };
    if (setPayload.title !== undefined) log.title = true;
    if (setPayload.titleEn !== undefined) log.titleEn = true;
    if (setPayload.content !== undefined) log.content = true;
    if (setPayload.contentEn !== undefined) log.contentEn = true;
    console.log(JSON.stringify(log));

    if (mode.apply) {
      await db.update(postsTable).set(setPayload).where(eq(postsTable.id, row.id));
      applied += 1;
    }
  }

  console.log(
    mode.apply
      ? `完成：已写库 ${applied} 条；跳过 title ${warnTitle}、titleEn ${warnTitleEn}；共扫描 ${targets.length} 条。`
      : `dry-run：将更新 ${wouldUpdate} 条（加 --apply 写库）；跳过 title ${warnTitle}、titleEn ${warnTitleEn}；共 ${targets.length} 条。`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
