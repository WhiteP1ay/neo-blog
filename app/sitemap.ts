import { MetadataRoute } from "next";
import { getPosts } from "@/server/actions/posts";

/**
 * 重新验证时间（ISR）
 * 3600秒（1小时）后重新生成sitemap
 * 这样新文章发布后，sitemap会在1小时内自动更新，无需重新构建
 */
export const revalidate = 3600;

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
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...routes, ...postRoutes];
}
