import { NextResponse, type NextRequest } from "next/server";

/**
 * 动态回显 Origin 的 CORS 头。
 * 说明：
 * - 不做白名单校验，来什么 Origin 回什么 Origin
 * - 若无 Origin，则不设置 Access-Control-Allow-Origin
 */
function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), request);
  }
  return applyCorsHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/api/:path*"],
};

