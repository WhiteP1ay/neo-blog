import { NextRequest, NextResponse } from "next/server";
import { createComment } from "@/server/actions/comments";

/**
 * 从请求头中获取客户端IP
 */
function getClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIP = headers.get("x-real-ip");

  if (forwarded) {
    // x-forwarded-for可能包含多个IP，取第一个
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * 创建评论API
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers);

    const body = await request.json();
    const { postId, parentId, author, email, content } = body;

    if (!postId || !author || !content) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const result = await createComment({
      postId,
      parentId: parentId || null,
      author,
      email: email || undefined,
      content,
      ip: clientIP,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json(
      { success: false, error: "创建评论失败" },
      { status: 500 }
    );
  }
}

