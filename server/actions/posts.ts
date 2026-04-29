"use server";

import { db } from "@/server/db/db";
import { explorerNodesTable, postsTable } from "@/server/db/schema";
import { desc, eq, max } from "drizzle-orm";
import { getSession, requireAdminSession } from "@/server/utils/auth";
import { uploadImageToOss } from "@/server/utils/oss";
import { highlightCodeBlocksInHtml } from "@/server/utils/highlight-code-blocks-in-html";
import { markdownToHTML } from "@/server/utils/markdown";
import { derivePostMetadata } from "@/server/utils/post-metadata";
import {
  actionErr,
  actionOk,
  actionOkVoid,
} from "@/server/types/action-result";
import type {
  ActionResult,
  ActionVoidResult,
} from "@/server/types/action-result";
import type { HomeExplorerCategory, HomePostPreview } from "@/server/types/explorer";
import type { Post } from "@/server/types/models";

const ROOT_NAME = "根目录";

async function getOrCreateRootNodeId(): Promise<number> {
  const existing = await db.query.explorerNodesTable.findFirst({
    where: (nodes, { and, eq: eqFn, isNull }) =>
      and(eqFn(nodes.nodeType, "folder"), isNull(nodes.parentId), eqFn(nodes.name, ROOT_NAME)),
  });
  if (existing) return existing.id;
  const rows = await db
    .insert(explorerNodesTable)
    .values({
      parentId: null,
      name: ROOT_NAME,
      nodeType: "folder",
      sortOrder: 0,
    })
    .returning();
  return rows[0].id;
}

/**
 * 校验目录节点并在其下创建 markdown 节点。
 */
async function createMarkdownNodeForPost(
  parentNodeId: number,
  post: Pick<Post, "id" | "title">,
): Promise<ActionVoidResult> {
  const parentNode = await db.query.explorerNodesTable.findFirst({
    where: (nodes, { eq }) => eq(nodes.id, parentNodeId),
  });
  if (!parentNode || parentNode.nodeType !== "folder") {
    return actionErr("node 必须是有效目录");
  }
  const maxRow = await db
    .select({ m: max(explorerNodesTable.sortOrder) })
    .from(explorerNodesTable)
    .where(eq(explorerNodesTable.parentId, parentNodeId));
  const nextSort = (maxRow[0]?.m ?? -1) + 1;
  const rows = await db.insert(explorerNodesTable).values({
    parentId: parentNodeId,
    name: `${post.title}.md`,
    nodeType: "markdown",
    sortOrder: nextSort,
  }).returning();
  await db.update(postsTable).set({
    nodeId: rows[0].id,
    updatedAt: new Date(),
  }).where(eq(postsTable.id, post.id));
  await db.update(explorerNodesTable).set({
    name: `${post.title}.md`,
    updatedAt: new Date(),
  }).where(eq(explorerNodesTable.id, rows[0].id));
  return actionOkVoid();
}

async function ensureFolderNode(parentNodeId: number): Promise<ActionResult<void>> {
  const parentNode = await db.query.explorerNodesTable.findFirst({
    where: (nodes, { eq }) => eq(nodes.id, parentNodeId),
  });
  if (!parentNode || parentNode.nodeType !== "folder") {
    return actionErr("node 必须是有效目录");
  }
  return actionOk(undefined);
}

/**
 * Server Action: 获取所有文章列表（置顶文章在前，然后按创建时间倒序）
 */
export async function getPosts(): Promise<ActionResult<Post[]>> {
  try {
    const posts = await db
      .select()
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));
    return actionOk(posts);
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return actionErr("获取文章列表失败");
  }
}

/**
 * 首页最近文章（置顶优先，再按创建时间倒序）
 */
export async function getLatestPostsForHome(
  limit = 5,
): Promise<ActionResult<HomePostPreview[]>> {
  try {
    const rows = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        createdAt: postsTable.createdAt,
        isPinned: postsTable.isPinned,
      })
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt))
      .limit(limit);
    return actionOk(rows as HomePostPreview[]);
  } catch (error) {
    console.error("获取首页文章失败:", error);
    return actionErr("获取文章失败");
  }
}

/**
 * 未分类（无专题文章）+ 各可见专题及其文章列表
 */
export async function getHomeExplorerData(): Promise<
  ActionResult<HomeExplorerCategory[]>
> {
  try {
    const posts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        createdAt: postsTable.createdAt,
        isPinned: postsTable.isPinned,
      })
      .from(postsTable)
      .orderBy(desc(postsTable.isPinned), desc(postsTable.createdAt));
    return actionOk([
      {
        topicKey: 0,
        name: "全部",
        isPinned: false,
        sortOrder: 0,
        createdAt: null,
        posts,
      },
    ]);
  } catch (error) {
    console.error("获取首页浏览数据失败:", error);
    return actionErr("获取首页浏览数据失败");
  }
}

/**
 * Server Action: 根据ID获取单篇文章
 * @param highlightCode true 时对正文中的 pre/code 做 Shiki 服务端高亮（编辑页、导出等应传 false 保持原始 HTML）
 */
export async function getPostById(
  id: number,
  highlightCode = false,
): Promise<ActionResult<Post>> {
  try {
    const post = await db.query.postsTable.findFirst({
      where: (posts, { eq }) => eq(posts.id, id),
    });

    if (!post) {
      return actionErr("文章不存在");
    }

    if (!highlightCode) {
      return actionOk(post);
    }

    const content = await highlightCodeBlocksInHtml(post.content);
    return actionOk({ ...post, content });
  } catch (error) {
    console.error("获取文章失败:", error);
    return actionErr("获取文章失败");
  }
}

/**
 * Server Action: 创建文章
 */
export async function createPost(data: {
  title: string;
  content: string;
  markdownContent?: string | null;
  nodeId?: number | null;
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
    const result = await db
      .insert(postsTable)
      .values({
        title: data.title,
        content: data.content,
        markdownContent: data.markdownContent || null,
        coverUrl: metadata.coverUrl,
        excerpt: metadata.excerpt,
      })
      .returning();
    const created = result[0];
    const targetFolderId = data.nodeId ?? (await getOrCreateRootNodeId());
    const folderCheck = await ensureFolderNode(targetFolderId);
      if (!folderCheck.success) return actionErr(folderCheck.error);
      const nodeResult = await createMarkdownNodeForPost(targetFolderId, { id: created.id, title: created.title });
      if (!nodeResult.success) return actionErr(nodeResult.error);
    return actionOk(created);
  } catch (error) {
    console.error("创建文章失败:", error);
    return actionErr("创建文章失败");
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
      return actionErr("文章不存在");
    }

    const nextContent = data.content ?? existing.content;
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
      isPinned?: boolean;
      createdAt?: Date | null;
      updatedAt?: Date | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.markdownContent !== undefined)
      updateData.markdownContent = data.markdownContent;
    updateData.coverUrl = metadata.coverUrl;
    updateData.excerpt = metadata.excerpt;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    if (data.createdAt !== undefined) {
      updateData.createdAt = data.createdAt;
    }

    if (data.updatedAt !== undefined) {
      updateData.updatedAt = data.updatedAt;
    } else if (
      data.title !== undefined ||
      data.content !== undefined ||
      data.isPinned !== undefined
    ) {
      updateData.updatedAt = new Date();
    }

    const result = await db
      .update(postsTable)
      .set(updateData)
      .where(eq(postsTable.id, id))
      .returning();

    if (result.length === 0) {
      return actionErr("文章不存在");
    }

    return actionOk(result[0]);
  } catch (error) {
    console.error("更新文章失败:", error);
    return actionErr("更新文章失败");
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
    const result = await db
      .delete(postsTable)
      .where(eq(postsTable.id, id))
      .returning();

    if (result.length === 0) {
      return actionErr("文章不存在");
    }

    const deleted = result[0];
    if (deleted.nodeId != null) {
      await db.delete(explorerNodesTable).where(eq(explorerNodesTable.id, deleted.nodeId));
    }
    return actionOkVoid();
  } catch (error) {
    console.error("删除文章失败:", error);
    return actionErr("删除文章失败");
  }
}

/**
 * Server Action: 管理员上传 Markdown 文件，创建新文章或覆盖指定文章的正文与标题
 */
export async function uploadMarkdownFromForm(
  formData: FormData,
): Promise<ActionResult<Post>> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const file = formData.get("file") as File | null;
    const postIdRaw = formData.get("postId") as string | null;
    const nodeIdRaw = formData.get("nodeId") as string | null;

    if (!file) {
      return actionErr("未找到文件");
    }

    const text = await file.text();

    let title = file.name.replace(/\.md$/i, "");
    const lines = text.split("\n");
    if (lines[0]?.startsWith("# ")) {
      title = lines[0].substring(2).trim();
    }

    const htmlContent = markdownToHTML(text);
    const nodeId =
      nodeIdRaw && Number.isFinite(Number(nodeIdRaw))
        ? Number.parseInt(nodeIdRaw, 10)
        : null;

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
      nodeId,
    });

    if (!result.success) {
      return actionErr(result.error);
    }

    return actionOk(result.data);
  } catch (error) {
    console.error("文件上传失败:", error);
    return actionErr("文件上传失败");
  }
}

/**
 * Server Action: 管理员上传图片（专题封面等，实际上传逻辑待接 OSS）
 */
export async function uploadAdminImageFromForm(
  formData: FormData,
): Promise<
  ActionResult<{
    url: string;
    objectKey: string;
    size: number;
    mimeType: string;
    width: number | null;
    height: number | null;
  }>
> {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return actionErr(gate.error);
  }

  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return actionErr("未找到文件");
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return actionErr("图片大小不能超过 5MB");
    }

    const uploaded = await uploadImageToOss(file, "admin-images");
    return actionOk(uploaded);
  } catch (error) {
    console.error("图片上传失败:", error);
    return actionErr(error instanceof Error ? error.message : "图片上传失败");
  }
}
