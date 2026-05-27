import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';
import type * as schema from '@/server/db/schema';
import { postsTable } from '@/server/db/schema';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import {
  extractFirstH1PlainText,
  stripLeadingDecorationsFromFirstH1InHtml,
} from '@/server/utils/post-ai-translation-html';
import { buildPostSearchIndexFields } from '@/server/utils/post-search-index';
import { loadTypesByPostIds, type PostTypeRow } from '@/server/utils/post-type-assignments';

type Db = NodePgDatabase<typeof schema>;

type PostRow = typeof postsTable.$inferSelect;

export type AiPolishApplyInput = {
  content: string;
  contentEn?: string | null;
};

function summarizeTypes(rows: PostTypeRow[]) {
  return rows.map((t) => ({
    id: t.id,
    code: t.code,
    nameZh: t.nameZh,
    nameEn: t.nameEn,
  }));
}

export async function applyAiPolishToPost(db: Db, postId: number, post: PostRow, input: AiPolishApplyInput) {
  const content = stripLeadingDecorationsFromFirstH1InHtml(input.content.trim());
  if (!content.trim()) {
    throw new Error('content 不能为空');
  }

  let nextTitle = post.title;
  const h1Text = extractFirstH1PlainText(content);
  if (h1Text) {
    const stripped = stripLeadingTypeLikePrefixes(h1Text);
    if (stripped.length > 0) {
      nextTitle = stripped;
    }
  }

  const metadata = derivePostMetadata({
    content,
    markdownContent: null,
  });

  const hasContentEn = input.contentEn !== undefined;
  let nextTitleEn: string | null = post.titleEn ?? null;
  let excerptEn: string | null = post.excerptEn ?? null;
  let contentEn: string | null = post.contentEn ?? null;

  if (hasContentEn) {
    const trimmed = (input.contentEn ?? '').trim();
    if (trimmed.length > 0) {
      contentEn = stripLeadingDecorationsFromFirstH1InHtml(trimmed);
      const h1En = extractFirstH1PlainText(contentEn);
      const stripped = h1En ? stripLeadingTypeLikePrefixes(h1En) : '';
      nextTitleEn = stripped.length > 0 ? stripped : null;
      excerptEn =
        derivePostMetadata({
          content: contentEn,
          markdownContent: null,
        }).excerpt ?? null;
    } else {
      contentEn = null;
      nextTitleEn = null;
      excerptEn = null;
    }
  }

  const updateValues: {
    content: string;
    title: string;
    excerpt: string;
    coverUrl: string | null;
    updatedAt: Date;
    contentEn?: string | null;
    excerptEn?: string | null;
    titleEn?: string | null;
  } = {
    content,
    title: nextTitle,
    excerpt: metadata.excerpt,
    coverUrl: metadata.coverUrl,
    updatedAt: new Date(),
  };

  if (hasContentEn) {
    updateValues.contentEn = contentEn;
    updateValues.excerptEn = excerptEn;
    updateValues.titleEn = nextTitleEn;
  }

  const searchIndex = buildPostSearchIndexFields(nextTitle, post.markdownContent);
  const updated = await db
    .update(postsTable)
    .set({
      ...updateValues,
      plainBody: searchIndex.plainBody,
      searchVector: searchIndex.searchVector,
    })
    .where(eq(postsTable.id, postId))
    .returning({
      id: postsTable.id,
      title: postsTable.title,
      titleEn: postsTable.titleEn,
      sortOrder: postsTable.sortOrder,
      isHidden: postsTable.isHidden,
      isPinned: postsTable.isPinned,
      coverUrl: postsTable.coverUrl,
      excerpt: postsTable.excerpt,
      excerptEn: postsTable.excerptEn,
      updatedAt: postsTable.updatedAt,
    });

  if (!updated[0]) {
    throw new Error('更新失败');
  }

  const typeMap = await loadTypesByPostIds(db, [postId]);
  return {
    ...updated[0],
    types: summarizeTypes(typeMap.get(postId) ?? []),
  };
}
