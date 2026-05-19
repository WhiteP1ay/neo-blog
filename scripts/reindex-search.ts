/**
 * 为已有文章回填 plainBody 与 searchVector（需 zhparser + chinese 配置）
 *
 * 用法: pnpm db:reindex-search
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../server/db/db";
import { postsTable } from "../server/db/schema";
import { buildPlainBody } from "../server/utils/postPlainText";
import { buildSearchVectorSql } from "../server/utils/searchIndex";

async function main() {
  const posts = await db.select().from(postsTable);

  for (const post of posts) {
    const plainBody = buildPlainBody(post.markdownContent);
    await db
      .update(postsTable)
      .set({
        plainBody,
        searchVector: buildSearchVectorSql(post.title, plainBody),
      })
      .where(eq(postsTable.id, post.id));
  }

  console.log(`✅ 已重建 ${posts.length} 篇文章的搜索索引`);
}

main()
  .catch((error) => {
    console.error("❌ 重建搜索索引失败:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
