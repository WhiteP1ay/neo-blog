import { NextRequest, NextResponse } from "next/server";
import { createAnalytics } from "@/server/actions/analytics";
import { parseUserAgent } from "@/server/utils/userAgent";

/**
 * 从请求头中获取客户端IP
 */
function getClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIP = headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * 埋点API - 存储到数据库
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP = getClientIP(request.headers);

    // 解析UserAgent，生成可读信息
    const rawUserAgent = body.userAgent || request.headers.get("user-agent") || "";
    const parsedUA = parseUserAgent(rawUserAgent);

    // 合并metadata，包含原始userAgent和解析详情
    const metadata = {
      ...body.metadata,
      userAgentRaw: rawUserAgent, // 保留原始userAgent
      userAgentParsed: {
        device: parsedUA.device,
        browser: parsedUA.browser,
        os: parsedUA.os,
        isWeChat: parsedUA.isWeChat,
      },
    };

    // 存储到数据库，userAgent字段存储可读字符串
    const result = await createAnalytics({
      type: body.type,
      action: body.action,
      target: body.target,
      url: body.url,
      ip: clientIP,
      userAgent: parsedUA.readable, // 存储可读字符串
      metadata: metadata,
    });

    if (!result.success) {
      console.error("埋点存储失败:", result.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    // 埋点失败不应该影响用户体验，静默返回成功
    return NextResponse.json({ success: true });
  }
}

