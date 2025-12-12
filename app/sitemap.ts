import { MetadataRoute } from "next";
import { getPosts } from "@/server/actions/posts";

/**
 * 重新验证时间（ISR）
 * 3600秒（1小时）后重新生成sitemap
 * 这样新文章发布后，sitemap会在1小时内自动更新，无需重新构建
 */
export const revalidate = 3600;

/**
 * 生成sitemap.xml（SEO优化）
 * 
 * 执行时机：
 * 1. 构建时（build time）：首次生成静态sitemap.xml
 * 2. 请求时（request time）：如果超过revalidate时间，会在后台重新生成
 * 3. 每次请求都会检查，但实际重新生成只在超过revalidate间隔时发生
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  
  // 获取所有文章
  const result = await getPosts();
  const posts = result.success && result.data ? result.data : [];

  // 首页
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // 文章页面
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/${post.id}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...routes, ...postRoutes];
}
