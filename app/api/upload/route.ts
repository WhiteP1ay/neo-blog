import { NextRequest, NextResponse } from "next/server";
import { markdownToHTML } from "@/server/utils/markdown";
import { createPost, updatePost } from "@/server/actions/posts";
import { getSession } from "@/server/utils/auth";

/**
 * 处理Markdown文件上传
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
    const postId = formData.get("postId") as string | null; // 如果有postId，说明是更新

    if (!file) {
      return NextResponse.json(
        { success: false, error: "未找到文件" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const text = await file.text();
    
    // 从文件名或第一行提取标题
    let title = file.name.replace(/\.md$/i, "");
    const lines = text.split("\n");
    if (lines[0].startsWith("# ")) {
      title = lines[0].substring(2).trim();
    }

    // 将Markdown转换为HTML
    const htmlContent = markdownToHTML(text);

    // 保存到数据库（同时保存markdown和HTML）
    if (postId) {
      // 更新现有文章
      const result = await updatePost(parseInt(postId, 10), {
        title,
        content: htmlContent,
        markdownContent: text, // 保存原始markdown
      });
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    } else {
      // 创建新文章
      const result = await createPost({
        title,
        content: htmlContent,
        markdownContent: text, // 保存原始markdown
      });
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json(
      { success: false, error: "文件上传失败" },
      { status: 500 }
    );
  }
}

