/**
 * 将旧版「中文正文底部拼接英文」迁移为 posts.contentEn / titleEn / excerptEn，
 * 并用 stripTranslationArtifacts 清洗中文 content。
 *
 * 【一次性迁移】假定已在目标库执行完毕；勿在新库盲目重跑。
 * 若确需重放：`pnpm tsx scripts/archive/migrate-bilingual-post-columns.ts`
 */
import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import {
  EN_SECTION_WRAP_ID,
  extractEnglishFragmentFromLegacyAppend,
  extractFirstH1PlainText,
  stripTranslationArtifacts,
} from '@/server/utils/post-ai-translation-html';
import { derivePostMetadata } from '@/server/utils/post-metadata';

async function main() {
  const marker = `%${EN_SECTION_WRAP_ID}%`;
  const rows = await db
    .select({ id: postsTable.id, content: postsTable.content })
    .from(postsTable)
    .where(sql`${postsTable.content} LIKE ${marker}`);

  if (rows.length === 0) {
    console.log('没有需要迁移的含英文包裹块的文章。');
    return;
  }

  console.log(`找到 ${rows.length} 篇含「${EN_SECTION_WRAP_ID}」的正文，开始迁移…`);

  for (const row of rows) {
    const en = extractEnglishFragmentFromLegacyAppend(row.content);
    const zh = stripTranslationArtifacts(row.content);
    if (!en) {
      console.warn(`跳过 id=${row.id}：未能解析英文片段`);
      continue;
    }

    const titleEn = extractFirstH1PlainText(en);
    const excerptEn = derivePostMetadata({ content: en, markdownContent: null }).excerpt;

    await db
      .update(postsTable)
      .set({
        content: zh,
        contentEn: en,
        titleEn: titleEn ?? null,
        excerptEn,
        updatedAt: new Date(),
      })
      .where(eq(postsTable.id, row.id));

    console.log(`已迁移 post id=${row.id}`);
  }

  console.log('完成。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
