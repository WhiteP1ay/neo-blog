import { NextResponse } from "next/server";
import { getSession, requireAdminSession } from "@/server/utils/auth";
import { getSystemNodeIds } from "@/server/actions/explorer-nodes";
import { uploadMarkdownFromForm } from "@/server/actions/posts";

/**
 * 上传 Markdown 文章（支持 nodeId 指定目录）。
 */
export async function POST(request: Request) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === "未登录" ? 401 : 403 });
  }
  try {
    const formData = await request.formData();
    const systemNodeResult = await getSystemNodeIds();
    if (!systemNodeResult.success) {
      return NextResponse.json({ error: systemNodeResult.error }, { status: 400 });
    }
    const nodeIdRaw = formData.get("nodeId");
    if (!(typeof nodeIdRaw === "string" && nodeIdRaw.trim())) {
      formData.set("nodeId", String(systemNodeResult.data.postsRootNodeId));
    }
    const result = await uploadMarkdownFromForm(formData);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.data.id,
      title: result.data.title,
      content: result.data.markdownContent ?? result.data.content,
      created_at: result.data.createdAt,
      updated_at: result.data.updatedAt,
    });
  } catch (error) {
    console.error("上传 Markdown 失败:", error);
    return NextResponse.json({ error: "上传 Markdown 失败" }, { status: 500 });
  }
}

