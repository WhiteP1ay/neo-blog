import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/utils/auth";

/**
 * 处理图片上传（用于专题封面图等）
 */
export async function POST(request: NextRequest) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "未找到文件" },
        { status: 400 }
      );
    }

    // 检查文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式" },
        { status: 400 }
      );
    }

    // 检查文件大小（限制为 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "图片大小不能超过 5MB" },
        { status: 400 }
      );
    }

    // 将图片转换为 base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    
    // 获取 MIME 类型
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ success: true, data: { url: dataUrl } });
  } catch (error) {
    console.error("图片上传失败:", error);
    return NextResponse.json(
      { success: false, error: "图片上传失败" },
      { status: 500 }
    );
  }
}

