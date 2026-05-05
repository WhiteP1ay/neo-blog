import type { MetadataRoute } from 'next';
import { getPosts } from '@/server/actions/posts';

/**
 * 重新验证时间（ISR）
 * 3600秒（1小时）后重新生成sitemap
 * 这样新文章发布后，sitemap会在1小时内自动更新，无需重新构建
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://whitemeta.cn';

  // 获取所有文章
  const postsResult = await getPosts();
  const posts = postsResult.success && postsResult.data ? postsResult.data : [];

  // 首页与核心前台页面（精简版）
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 文章页面
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...routes, ...postRoutes];
}
