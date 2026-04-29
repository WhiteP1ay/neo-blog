import { NextResponse, type NextRequest } from "next/server";
import { deletePost, getPostById, updatePost } from "@/server/actions/posts";
import { markdownToHTML } from "@/server/utils/markdown";
import { getSession, requireAdminSession } from "@/server/utils/auth";

function parsePostId(rawId: string): number | null {
  const id = Number.parseInt(rawId, 10);
  return Number.isFinite(id) ? id : null;
}

/**
 * 获取文章详情。
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = parsePostId(id);
    if (postId == null) {
      return NextResponse.json({ error: "无效的文章 ID" }, { status: 400 });
    }
    const result = await getPostById(postId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    const post = result.data;
    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.markdownContent ?? post.content,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    });
  } catch (error) {
    console.error("获取文章详情失败:", error);
    return NextResponse.json({ error: "获取文章详情失败" }, { status: 500 });
  }
}

/**
 * 更新文章正文。
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === "未登录" ? 401 : 403 });
  }
  try {
    const { id } = await params;
    const postId = parsePostId(id);
    if (postId == null) {
      return NextResponse.json({ error: "无效的文章 ID" }, { status: 400 });
    }
    const body = (await request.json()) as { title?: unknown; content?: unknown };
    const nextData: { title?: string; content?: string; markdownContent?: string | null } = {};
    if (typeof body.title === "string" && body.title.trim()) {
      nextData.title = body.title.trim();
    }
    if (typeof body.content === "string") {
      const markdown = body.content;
      nextData.markdownContent = markdown;
      nextData.content = markdownToHTML(markdown);
    }
    if (Object.keys(nextData).length === 0) {
      return NextResponse.json({ error: "未提供可更新字段" }, { status: 400 });
    }
    const result = await updatePost(postId, nextData);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.data.id,
      title: result.data.title,
      content: result.data.markdownContent ?? result.data.content,
      updated_at: result.data.updatedAt,
    });
  } catch (error) {
    console.error("更新文章失败:", error);
    return NextResponse.json({ error: "更新文章失败" }, { status: 500 });
  }
}

/**
 * 删除文章。
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === "未登录" ? 401 : 403 });
  }
  try {
    const { id } = await params;
    const postId = parsePostId(id);
    if (postId == null) {
      return NextResponse.json({ error: "无效的文章 ID" }, { status: 400 });
    }
    const result = await deletePost(postId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("删除文章失败:", error);
    return NextResponse.json({ error: "删除文章失败" }, { status: 500 });
  }
}

