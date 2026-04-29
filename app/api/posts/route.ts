import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/server/db/db";
import { explorerNodesTable, postsTable } from "@/server/db/schema";
import { getSystemNodeIds } from "@/server/actions/explorer-nodes";
import { createPost } from "@/server/actions/posts";
import { markdownToHTML } from "@/server/utils/markdown";
import { getSession, requireAdminSession } from "@/server/utils/auth";

/**
 * 文章列表：仅返回轻量字段，避免传输完整正文。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeRaw = searchParams.get("node");
    const nodeId = nodeRaw ? Number.parseInt(nodeRaw, 10) : null;
    let rows: Array<{
      id: number;
      title: string;
      excerpt: string | null;
      coverUrl: string | null;
      createdAt: Date | null;
    }> = [];

    if (nodeRaw != null) {
      if (!Number.isFinite(nodeId)) {
        return NextResponse.json({ error: "node 参数无效" }, { status: 400 });
      }
      const allNodes = await db.select().from(explorerNodesTable);
      const allPosts = await db.select({ id: postsTable.id, nodeId: postsTable.nodeId }).from(postsTable);
      const postIdByNode = new Map<number, number>();
      for (const post of allPosts) {
        if (post.nodeId != null) postIdByNode.set(post.nodeId, post.id);
      }
      const rootNode = allNodes.find((item) => item.id === nodeId);
      if (!rootNode) {
        return NextResponse.json({ error: "node 不存在" }, { status: 404 });
      }
      if (rootNode.nodeType !== "folder") {
        return NextResponse.json({ error: "node 必须是目录" }, { status: 400 });
      }
      const byParent = new Map<number, typeof allNodes>();
      for (const item of allNodes) {
        if (item.parentId == null) continue;
        const group = byParent.get(item.parentId);
        if (group) group.push(item);
        else byParent.set(item.parentId, [item]);
      }
      const queue = [nodeId];
      const postIds = new Set<number>();
      while (queue.length > 0) {
        const current = queue.shift();
        if (current == null) break;
        const children = byParent.get(current) ?? [];
        for (const child of children) {
          if (child.nodeType === "markdown") {
            const postId = postIdByNode.get(child.id);
            if (postId != null) postIds.add(postId);
          }
          if (child.nodeType === "folder") {
            queue.push(child.id);
          }
        }
      }
      if (postIds.size === 0) {
        return NextResponse.json([]);
      }
      rows = await db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          excerpt: postsTable.excerpt,
          coverUrl: postsTable.coverUrl,
          createdAt: postsTable.createdAt,
        })
        .from(postsTable)
        .where(inArray(postsTable.id, [...postIds]))
        .orderBy(desc(postsTable.createdAt));
    } else {
      rows = await db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          excerpt: postsTable.excerpt,
          coverUrl: postsTable.coverUrl,
          createdAt: postsTable.createdAt,
        })
        .from(postsTable)
        .orderBy(desc(postsTable.createdAt));
    }

    return NextResponse.json(
      rows.map((item) => ({
        id: item.id,
        title: item.title,
        excerpt: item.excerpt ?? "",
        cover_url: item.coverUrl,
        created_at: item.createdAt,
      })),
    );
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json({ error: "获取文章列表失败" }, { status: 500 });
  }
}

/**
 * 创建文章（支持指定目录 nodeId）。
 */
export async function POST(request: Request) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === "未登录" ? 401 : 403 });
  }
  try {
    const body = (await request.json()) as {
      title?: unknown;
      content?: unknown;
      nodeId?: unknown;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";
    const nodeId =
      typeof body.nodeId === "number" && Number.isFinite(body.nodeId)
        ? body.nodeId
        : typeof body.nodeId === "string" && body.nodeId.trim()
          ? Number.parseInt(body.nodeId, 10)
          : null;
    const systemNodeResult = await getSystemNodeIds();
    if (!systemNodeResult.success) {
      return NextResponse.json({ error: systemNodeResult.error }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "title 不能为空" }, { status: 400 });
    }
    if (!content.trim()) {
      return NextResponse.json({ error: "content 不能为空" }, { status: 400 });
    }
    const result = await createPost({
      title,
      content: markdownToHTML(content),
      markdownContent: content,
      nodeId: nodeId ?? systemNodeResult.data.postsRootNodeId,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.data.id,
      title: result.data.title,
      content: result.data.markdownContent ?? result.data.content,
      created_at: result.data.createdAt,
    });
  } catch (error) {
    console.error("创建文章失败:", error);
    return NextResponse.json({ error: "创建文章失败" }, { status: 500 });
  }
}

