import type { Metadata } from 'next';
import { getHomeFeaturedPosts } from '@/server/actions/posts';
import { HomeFeatured } from '@/components/site/HomeFeatured';
import { SiteShell } from '@/components/site/SiteShell';
import { SiteWelcome } from '@/components/site/SiteWelcome';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'White Meta',
  description: 'White Meta 白玩dev 的个人网站',
  keywords: ['博客', '技术文章', '编程', '开发'],
  openGraph: {
    title: 'White Meta',
    description: 'White Meta 白玩dev 的个人网站',
    type: 'website',
  },
};

export default async function Home() {
  const result = await getHomeFeaturedPosts(5);
  const posts = result.success ? result.data : [];

  return (
    <SiteShell>
      <div className="mb-6 sm:mb-8">
        <SiteWelcome />
      </div>
      <HomeFeatured posts={posts} />
    </SiteShell>
  );
}
