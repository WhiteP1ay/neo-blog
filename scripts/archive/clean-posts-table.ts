/**
 * 博文表清洗：拆旧版内嵌英文 → 补中文摘要 → 全量中文润色（DeepSeek）→ 补英文正文/标题/摘要。
 *
 * 【高风险 / 非日常】会改库并调用外部 API。已移出 `package.json` 快捷命令，避免误触。
 * 若确需执行：
 *   pnpm tsx scripts/archive/clean-posts-table.ts
 *   pnpm tsx scripts/archive/clean-posts-table.ts --dry-run
 *   pnpm tsx scripts/archive/clean-posts-table.ts --limit 5
 *   pnpm tsx scripts/archive/clean-posts-table.ts --ids 1,2,44
 *   pnpm tsx scripts/archive/clean-posts-table.ts --delay-ms 800
 *
 * 依赖：DATABASE_URL、DEEPSEEK_API_KEY（非 dry-run 时必填）。
 */
import 'dotenv/config';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import {
  extractEnglishFragmentFromLegacyAppend,
  extractFirstH1PlainText,
  stripTranslationArtifacts,
} from '@/server/utils/post-ai-translation-html';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import {
  MAX_AI_POLISH_HTML_CHARS,
  polishChineseHtml,
  translateChineseHtmlToEnglishForContentEn,
} from '@/server/utils/post-ai-polish-compute';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  let limit: number | undefined;
  const li = argv.indexOf('--limit');
  if (li >= 0 && argv[li + 1]) {
    limit = Number.parseInt(argv[li + 1], 10);
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error('--limit 需要正整数');
    }
  }
  let delayMs = 600;
  const di = argv.indexOf('--delay-ms');
  if (di >= 0 && argv[di + 1]) {
    const v = Number.parseInt(argv[di + 1], 10);
    if (Number.isFinite(v) && v >= 0) delayMs = v;
  }
  let ids: number[] | undefined;
  const ii = argv.indexOf('--ids');
  if (ii >= 0 && argv[ii + 1]) {
    ids = argv[ii + 1]
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length === 0) throw new Error('--ids 格式无效');
  }
  return { dryRun, limit, delayMs, ids };
}

function apiSignal(): AbortSignal {
  return AbortSignal.timeout(180_000);
}

async function main() {
  const { dryRun, limit, delayMs, ids } = parseArgs();

  if (!dryRun && !process.env.DEEPSEEK_API_KEY?.trim()) {
    console.error('未配置 DEEPSEEK_API_KEY，无法调用润色/翻译（或使用 --dry-run 仅做本地拆分与摘要）。');
    process.exit(1);
  }

  const baseQuery = ids?.length
    ? db.select().from(postsTable).where(inArray(postsTable.id, ids)).orderBy(asc(postsTable.id))
    : db.select().from(postsTable).orderBy(asc(postsTable.id));

  let rows = await baseQuery;
  if (limit !== undefined) {
    rows = rows.slice(0, limit);
  }

  if (rows.length === 0) {
    console.log('没有匹配的文章。');
    return;
  }

  console.log(`共处理 ${rows.length} 篇${dryRun ? '（dry-run，不写库）' : ''}…`);

  let failures = 0;

  for (const row of rows) {
    const id = row.id;
    try {
      let content = row.content ?? '';
      if (!content.trim()) {
        console.warn(`[skip] id=${id} 正文为空`);
        continue;
      }

      let contentEn = row.contentEn ?? null;
      let titleEn = row.titleEn ?? null;
      let excerptEn = row.excerptEn ?? null;
      let title = row.title;
      let excerpt = row.excerpt ?? '';
      let coverUrl = row.coverUrl ?? null;
      const markdownContent = row.markdownContent ?? null;

      // 1. 拆旧版内嵌英文
      const extracted = extractEnglishFragmentFromLegacyAppend(content);
      if (extracted) {
        content = stripTranslationArtifacts(content);
        if (!contentEn?.trim()) {
          contentEn = extracted;
        }
      }

      // 2. 中文摘要（润色前可先补一版）
      if (!excerpt?.trim()) {
        const meta = derivePostMetadata({ content, markdownContent });
        excerpt = meta.excerpt;
        if (coverUrl == null || coverUrl === '') {
          coverUrl = meta.coverUrl;
        }
      }

      // 3. 全量中文润色
      if (!dryRun && content.length <= MAX_AI_POLISH_HTML_CHARS) {
        content = await polishChineseHtml(content, apiSignal());
        await sleep(delayMs);
      } else if (!dryRun && content.length > MAX_AI_POLISH_HTML_CHARS) {
        console.warn(`[warn] id=${id} 正文过长（>${MAX_AI_POLISH_HTML_CHARS}），跳过润色`);
      } else if (dryRun) {
        console.log(`[dry-run] id=${id} 将调用 polishChineseHtml`);
      }

      const h1 = extractFirstH1PlainText(content);
      if (h1) title = h1;

      const metaAfter = derivePostMetadata({ content, markdownContent });
      excerpt = metaAfter.excerpt;
      if (coverUrl == null || coverUrl === '') {
        coverUrl = metaAfter.coverUrl;
      }

      // 4. 英文：无正文则翻译；有正文则补 titleEn / excerptEn
      if (!contentEn?.trim()) {
        if (!dryRun) {
          if (content.length > MAX_AI_POLISH_HTML_CHARS) {
            console.warn(`[warn] id=${id} 正文过长，跳过英译`);
          } else {
            contentEn = await translateChineseHtmlToEnglishForContentEn(content, apiSignal());
            await sleep(delayMs);
          }
        } else {
          console.log(`[dry-run] id=${id} 将调用 translateChineseHtmlToEnglishForContentEn`);
        }
      }

      if (contentEn?.trim()) {
        if (!titleEn?.trim()) {
          titleEn = extractFirstH1PlainText(contentEn) ?? null;
        }
        if (!excerptEn?.trim()) {
          excerptEn = derivePostMetadata({ content: contentEn, markdownContent: null }).excerpt;
        }
      }

      const patch = {
        content,
        title,
        excerpt,
        coverUrl,
        contentEn: contentEn?.trim() ? contentEn : null,
        titleEn: titleEn?.trim() ? titleEn : null,
        excerptEn: excerptEn?.trim() ? excerptEn : null,
        updatedAt: new Date(),
      };

      if (dryRun) {
        console.log(`[dry-run] id=${id} ok`);
        continue;
      }

      await db.update(postsTable).set(patch).where(eq(postsTable.id, id));
      console.log(`[ok] id=${id}`);
      await sleep(delayMs);
    } catch (e) {
      failures += 1;
      console.error(`[fail] id=${id}`, e instanceof Error ? e.message : e);
    }
  }

  if (failures > 0) {
    console.error(`完成，失败 ${failures} 篇。`);
    process.exit(1);
  }
  console.log('全部完成。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
