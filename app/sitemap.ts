import { MetadataRoute } from "next";
import { getPosts } from "@/server/actions/posts";
import { getTools } from "@/server/actions/tools";

/**
 * 重新验证时间（ISR）
 * 3600秒（1小时）后重新生成sitemap
 * 这样新文章发布后，sitemap会在1小时内自动更新，无需重新构建
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  // 获取所有文章
  const postsResult = await getPosts();
  const posts = postsResult.success && postsResult.data ? postsResult.data : [];

  // 获取所有工具
  const toolsResult = await getTools(false); // 不包含隐藏的工具
  const tools = toolsResult.success && toolsResult.data ? toolsResult.data : [];

  // 首页和重要页面
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/me`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
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
