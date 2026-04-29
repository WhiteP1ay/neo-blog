import { NextResponse } from "next/server";
import { createPhotoFileFromForm, getSystemNodeIds } from "@/server/actions/explorer-nodes";
import { getSession, requireAdminSession } from "@/server/utils/auth";

/**
 * 外部创建 photo：自动创建节点并写入 photos 表。
 * - 可传 nodeId/parentId 指定目录
 * - 未传目录时自动落到根目录
 */
export async function POST(request: Request) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === "未登录" ? 401 : 403 });
  }
  try {
    const formData = await request.formData();
    const parentRaw = formData.get("parentId") ?? formData.get("nodeId");
    let parentId: number | null = null;
    if (typeof parentRaw === "string" && parentRaw.trim()) {
      const parsed = Number.parseInt(parentRaw, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ error: "nodeId/parentId 无效" }, { status: 400 });
      }
      parentId = parsed;
    }
    if (parentId == null) {
      const systemNodeResult = await getSystemNodeIds();
      if (!systemNodeResult.success) {
        return NextResponse.json({ error: systemNodeResult.error }, { status: 400 });
      }
      parentId = systemNodeResult.data.photosRootNodeId;
    }

    const result = await createPhotoFileFromForm(parentId, formData);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.data.id,
      name: result.data.name,
      node_type: result.data.nodeType,
      parent_id: result.data.parentId,
      created_at: result.data.createdAt,
    });
  } catch (error) {
    console.error("创建 photo 失败:", error);
    return NextResponse.json({ error: "创建 photo 失败" }, { status: 500 });
  }
}

