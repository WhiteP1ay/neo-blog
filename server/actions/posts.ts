'use server';

import { cache } from 'react';
import { db } from '@/server/db/db';
import { postTypeAssignmentsTable, postTypesTable, postsTable } from '@/server/db/schema';
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';
import { markdownToHTML } from '@/server/utils/markdown';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { stripLeadingDecorationsFromFirstH1InHtml } from '@/server/utils/post-ai-translation-html';
import { actionErr, actionOk, actionOkVoid } from '@/server/types/action-result';
import type { ActionResult, ActionVoidResult } from '@/server/types/action-result';
import type { HomeExplorerCategory, HomeFeaturedPost, HomePostPreview } from '@/server/types/explorer';
import type { Post } from '@/server/types/models';
import type { SiteLocale } from '@/lib/site-locale';
import { buildPostSearchIndexFields } from '@/server/utils/post-search-index';

export type SearchPostResult = {
  id: number;
  title: string;
  isPinned: boolean;
  createdAt: Date | null;
  snippet: string | null;
  rank: number;
};

const MAX_SEARCH_QUERY_LENGTH = 100;
const DEFAULT_SEARCH_LIMIT = 20;

/**
 * Server Action: 获取所有文章列表（置顶文章在前，然后按创建时间倒序）
 */
export async function getPosts(): Promise<ActionResult<Post[]>> {
  try {
    const posts = await db.select().from(postsTable).orderBy(asc(postsTable.sortOrder), desc(postsTable.createdAt));
    return actionOk(posts);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return actionErr('获取文章列表失败');
  }
}

/**
 * 首页最近文章（置顶优先，再按创建时间倒序）
 */
export async function getLatestPostsForHome(limit = 5): Promise<ActionResult<HomePostPreview[]>> {
  try {
    const rows = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        createdAt: postsTable.createdAt,
        isPinned: postsTable.isPinned,
      })
      .from(postsTable)
      .orderBy(asc(postsTable.sortOrder), desc(postsTable.createdAt))
      .limit(limit);
    return actionOk(rows as HomePostPreview[]);
  } catch (error) {
    console.error('获取首页文章失败:', error);
    return actionErr('获取文章失败');
  }
}

/**
 * 首页精选：管理员勾选的若干篇，按 homeSortOrder 升序，默认上限 5 篇。
 */
export async function getHomeFeaturedPosts(limit = 5): Promise<ActionResult<HomeFeaturedPost[]>> {
  try {
    const rows = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        excerpt: postsTable.excerpt,
        coverUrl: postsTable.coverUrl,
        createdAt: postsTable.createdAt,
        titleEn: postsTable.titleEn,
        excerptEn: postsTable.excerptEn,
      })
      .from(postsTable)
      .where(and(eq(postsTable.homeFeatured, true), ne(postsTable.isHidden, true)))
      .orderBy(asc(postsTable.homeSortOrder), asc(postsTable.id))
      .limit(limit);
    return actionOk(rows);
  } catch (error) {
    console.error('获取首页精选失败:', error);
    return actionErr('获取首页精选失败');
  }
}

/**
 * 各可见专题及其文章列表（不再合成「全部」虚拟分类，
 * 由前端选第一个分类作为默认）。
 */
export async function getHomeExplorerData(locale: SiteLocale = 'zh'): Promise<ActionResult<HomeExplorerCategory[]>> {
  try {
    const [publicTypes, postRows, suppressedPostIdsRows, assignmentRows] = await Promise.all([
      db
        .select({
          id: postTypesTable.id,
          code: postTypesTable.code,
          nameZh: postTypesTable.nameZh,
          nameEn: postTypesTable.nameEn,
          sortOrder: postTypesTable.sortOrder,
        })
        .from(postTypesTable)
        .where(eq(postTypesTable.suppressLinkedPostsGlobally, false))
        .orderBy(asc(postTypesTable.sortOrder), asc(postTypesTable.id)),
      db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          titleEn: postsTable.titleEn,
          createdAt: postsTable.createdAt,
          isPinned: postsTable.isPinned,
          sortOrder: postsTable.sortOrder,
        })
        .from(postsTable)
        .where(ne(postsTable.isHidden, true))
        .orderBy(asc(postsTable.sortOrder), desc(postsTable.createdAt)),
      db
        .selectDistinct({ postId: postTypeAssignmentsTable.postId })
        .from(postTypeAssignmentsTable)
        .innerJoin(postTypesTable, eq(postTypeAssignmentsTable.typeId, postTypesTable.id))
        .where(eq(postTypesTable.suppressLinkedPostsGlobally, true)),
      db
        .select({
          postId: postTypeAssignmentsTable.postId,
          typeId: postTypeAssignmentsTable.typeId,
        })
        .from(postTypeAssignmentsTable),
    ]);

    const suppressedPostIds = new Set(suppressedPostIdsRows.map((r) => r.postId));
    const postsAllowed = postRows.filter((p) => !suppressedPostIds.has(p.id));

    const assignmentsByPost = new Map<number, number[]>();
    for (const row of assignmentRows) {
      const list = assignmentsByPost.get(row.postId) ?? [];
      list.push(row.typeId);
      assignmentsByPost.set(row.postId, list);
    }

    const publicTypeIds = new Set(publicTypes.map((t) => t.id));
    const typeLabel = (t: (typeof publicTypes)[number]) => (locale === 'en' ? t.nameEn : t.nameZh);

    const categories: HomeExplorerCategory[] = [];
    for (const t of publicTypes) {
      const postsInType: HomeExplorerCategory['posts'] = [];
      for (const post of postsAllowed) {
        const links = assignmentsByPost.get(post.id);
        if (!links?.includes(t.id)) continue;
        postsInType.push({
          id: post.id,
          title: post.title,
          titleEn: post.titleEn,
          createdAt: post.createdAt,
          isPinned: post.isPinned,
        });
      }
      categories.push({
        typeCode: t.code,
        name: typeLabel(t),
        isPinned: false,
        sortOrder: t.sortOrder,
        createdAt: null,
        posts: postsInType,
      });
    }

    const unnamed = locale === 'en' ? 'Unnamed' : '未命名';
    const uncategorized: HomeExplorerCategory['posts'] = [];
    for (const post of postsAllowed) {
      const links = assignmentsByPost.get(post.id) ?? [];
      const hasPublic = links.some((tid) => publicTypeIds.has(tid));
      if (hasPublic) continue;
      uncategorized.push({
        id: post.id,
        title: post.title,
        titleEn: post.titleEn,
        createdAt: post.createdAt,
        isPinned: post.isPinned,
      });
    }
    if (uncategorized.length > 0) {
      categories.push({
        typeCode: '',
        name: unnamed,
        isPinned: false,
        sortOrder: 1_000_000,
        createdAt: null,
        posts: uncategorized,
      });
    }

    return actionOk(categories);
  } catch (error) {
    console.error('获取首页浏览数据失败:', error);
    return actionErr('获取首页浏览数据失败');
  }
}

async function getPostByIdInternal(id: number, highlightCode: boolean): Promise<ActionResult<Post>> {
  try {
    const post = await db.query.postsTable.findFirst({
      where: (posts, { eq }) => eq(posts.id, id),
    });

    if (!post) {
      return actionErr('文章不存在');
    }

    if (!highlightCode) {
      return actionOk(post);
    }

    const content = await highlightCodeBlocksInHtml(post.content);
    return actionOk({ ...post, content });
  } catch (error) {
    console.error('获取文章失败:', error);
    return actionErr('获取文章失败');
  }
}

const getPostByIdNoHighlightCached = cache(async (id: number) => getPostByIdInternal(id, false));

/**
 * Server Action: 根据ID获取单篇文章
 * @param highlightCode true 时对正文中的 pre/code 做 Shiki 服务端高亮（编辑页、导出等应传 false 保持原始 HTML）
 */
export async function getPostById(id: number, highlightCode = false): Promise<ActionResult<Post>> {
  if (highlightCode) {
    return getPostByIdInternal(id, true);
  }
  return getPostByIdNoHighlightCached(id);
}

/**
 * Server Action: 中文全文搜索（zhparser，仅公开文章）
 */
export async function searchPosts(
  query: string,
  options?: { limit?: number; offset?: number },
): Promise<ActionResult<SearchPostResult[]>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return actionOk([]);
  }
  if (trimmed.length > MAX_SEARCH_QUERY_LENGTH) {
    return actionErr('搜索关键词过长');
  }

  const limit = Math.min(options?.limit ?? DEFAULT_SEARCH_LIMIT, 50);
  const offset = Math.max(options?.offset ?? 0, 0);

  try {
    const result = await db.execute<{
      id: number;
      title: string;
      isPinned: boolean;
      createdAt: Date | null;
      snippet: string | null;
      rank: number;
    }>(sql`
      SELECT
        p.id,
        p.title,
        p."isPinned",
        p."createdAt",
        ts_rank(p."searchVector", query) AS rank,
        ts_headline(
          'chinese',
          COALESCE(p."plainBody", ''),
          query,
          'MaxWords=60, MinWords=10, StartSel=<mark>, StopSel=</mark>'
        ) AS snippet
      FROM ${postsTable} p,
           plainto_tsquery('chinese', ${trimmed}) query
      WHERE p."searchVector" @@ query
        AND p."isHidden" = false
      ORDER BY p."isPinned" DESC, rank DESC, p."createdAt" DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    const rows = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      isPinned: row.isPinned,
      createdAt: row.createdAt,
      snippet: row.snippet,
      rank: Number(row.rank),
    }));

    return actionOk(rows);
  } catch (error) {
    console.error('搜索文章失败:', error);
    const message =
      error instanceof Error && error.message.includes('zhparser')
        ? '数据库未启用 zhparser 扩展，请使用带 zhparser 的 Postgres 镜像'
        : '搜索失败';
    return actionErr(message);
  }
}

/**
 * Server Action: 创建文章
 */
export async function createPost(data: {
  title: string;
  content: string;
  markdownContent?: string | null;
}): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const metadata = derivePostMetadata({
      markdownContent: data.markdownContent ?? null,
      content: data.content,
    });
    const searchIndex = buildPostSearchIndexFields(data.title, data.markdownContent);
    const result = await db
      .insert(postsTable)
      .values({
        title: data.title,
        // 让新文章天然落到列表最前：取当前最小 sortOrder 再 -1（无文章时回落到 0）。
        // C 端排序仍是 sortOrder ASC, createdAt DESC，新文章自然排在前面，
        // 同时不破坏管理员之前手动 DnD 排好的相对顺序。
        sortOrder:
          ((
            await db
              .select({ id: postsTable.id, sortOrder: postsTable.sortOrder })
              .from(postsTable)
              .orderBy(asc(postsTable.sortOrder))
              .limit(1)
          )[0]?.sortOrder ?? 1) - 1,
        content: data.content,
        markdownContent: data.markdownContent || null,
        coverUrl: metadata.coverUrl,
        excerpt: metadata.excerpt,
        plainBody: searchIndex.plainBody,
        searchVector: searchIndex.searchVector,
      })
      .returning();
    return actionOk(result[0]);
  } catch (error) {
    console.error('创建文章失败:', error);
    return actionErr('创建文章失败');
  }
}

/**
 * Server Action: 更新文章
 */
export async function updatePost(
  id: number,
  data: {
    title?: string;
    content?: string;
    markdownContent?: string | null;
    isPinned?: boolean;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  },
): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const existing = await db.query.postsTable.findFirst({
      where: (posts, { eq }) => eq(posts.id, id),
    });
    if (!existing) {
      return actionErr('文章不存在');
    }

    const nextContent =
      data.content !== undefined ? stripLeadingDecorationsFromFirstH1InHtml(data.content) : existing.content;
    const nextMarkdown = data.markdownContent ?? existing.markdownContent;
    const metadata = derivePostMetadata({
      markdownContent: nextMarkdown,
      content: nextContent,
    });

    const updateData: {
      title?: string;
      content?: string;
      markdownContent?: string | null;
      coverUrl?: string | null;
      excerpt?: string;
      plainBody?: string;
      searchVector?: ReturnType<typeof buildPostSearchIndexFields>['searchVector'];
      isPinned?: boolean;
      createdAt?: Date | null;
      updatedAt?: Date | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = nextContent;
    if (data.markdownContent !== undefined) updateData.markdownContent = data.markdownContent;
    updateData.coverUrl = metadata.coverUrl;
    updateData.excerpt = metadata.excerpt;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    if (data.createdAt !== undefined) {
      updateData.createdAt = data.createdAt;
    }

    if (data.updatedAt !== undefined) {
      updateData.updatedAt = data.updatedAt;
    } else if (data.title !== undefined || data.content !== undefined || data.isPinned !== undefined) {
      updateData.updatedAt = new Date();
    }

    if (data.title !== undefined || data.markdownContent !== undefined) {
      const title = data.title ?? existing.title;
      const markdown =
        data.markdownContent !== undefined ? data.markdownContent : existing.markdownContent;
      const searchIndex = buildPostSearchIndexFields(title, markdown);
      updateData.plainBody = searchIndex.plainBody;
      updateData.searchVector = searchIndex.searchVector;
    }

    const result = await db.update(postsTable).set(updateData).where(eq(postsTable.id, id)).returning();

    if (result.length === 0) {
      return actionErr('文章不存在');
    }

    return actionOk(result[0]);
  } catch (error) {
    console.error('更新文章失败:', error);
    return actionErr('更新文章失败');
  }
}

/**
 * Server Action: 删除文章
 */
export async function deletePost(id: number): Promise<ActionVoidResult> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const result = await db.delete(postsTable).where(eq(postsTable.id, id)).returning();

    if (result.length === 0) {
      return actionErr('文章不存在');
    }

    const deleted = result[0];
    void deleted;
    return actionOkVoid();
  } catch (error) {
    console.error('删除文章失败:', error);
    return actionErr('删除文章失败');
  }
}

/**
 * Server Action: 管理员上传 Markdown 文件，创建新文章或覆盖指定文章的正文与标题
 */
export async function uploadMarkdownFromForm(formData: FormData): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const file = formData.get('file') as File | null;
    const postIdRaw = formData.get('postId') as string | null;

    if (!file) {
      return actionErr('未找到文件');
    }

    const text = await file.text();

    let title = file.name.replace(/\.md$/i, '');
    const lines = text.split('\n');
    if (lines[0]?.startsWith('# ')) {
      title = lines[0].substring(2).trim();
    }

    const htmlContent = markdownToHTML(text);
    if (postIdRaw) {
      const result = await updatePost(Number.parseInt(postIdRaw, 10), {
        title,
        content: htmlContent,
        markdownContent: text,
      });

      if (!result.success) {
        return actionErr(result.error);
      }

      return actionOk(result.data);
    }

    const result = await createPost({
      title,
      content: htmlContent,
      markdownContent: text,
    });

    if (!result.success) {
      return actionErr(result.error);
    }

    return actionOk(result.data);
  } catch (error) {
    console.error('文件上传失败:', error);
    return actionErr('文件上传失败');
  }
}
