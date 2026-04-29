import { NextResponse } from "next/server";
import { createPhotoFileFromForm, getSystemNodeIds } from "@/server/actions/explorer-nodes";
import { getSession, requireAdminSession } from "@/server/utils/auth";
import { db } from "@/server/db/db";

/**
 * 通用上传接口：上传图片并自动同步创建 photo 节点。
 */
export async function POST(request: Request) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.error === "未登录" ? 401 : 403 });
  }
  try {
    const formData = await request.formData();
    const fileRaw = formData.get("file");
    if (!(fileRaw instanceof File)) {
      return NextResponse.json({ error: "file 缺失" }, { status: 400 });
    }
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
    if (!formData.get("title")) {
      formData.set("title", fileRaw.name);
    }
    const result = await createPhotoFileFromForm(parentId, formData);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const photo = await db.query.photosTable.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.nodeId, result.data.id),
    });
    return NextResponse.json({
      url: photo?.fileUrl ?? null,
      node: {
        id: result.data.id,
        name: result.data.name,
        node_type: result.data.nodeType,
        parent_id: result.data.parentId,
      },
    });
  } catch (error) {
    console.error("上传失败:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

