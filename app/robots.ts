import { MetadataRoute } from "next";

/**
 * 生成robots.txt（SEO优化）
 * 
 * 执行时机：
 * 1. 构建时（build time）：生成静态robots.txt文件
 * 2. 由于robots.txt内容相对固定，通常不需要频繁更新
 * 3. 如果需要动态内容，可以改为async函数，但通常静态生成即可
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/login/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
