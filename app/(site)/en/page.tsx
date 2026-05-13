import type { Metadata } from 'next';
import { getHomeFeaturedPosts } from '@/server/actions/posts';
import { HomeFeatured } from '@/components/site/HomeFeatured';
import { SiteWelcome } from '@/components/site/SiteWelcome';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'White Meta',
  description: 'White Meta — personal site of whitePlay (白玩dev)',
  keywords: ['blog', 'engineering', 'development'],
  openGraph: {
    title: 'White Meta',
    description: 'White Meta — personal site of whitePlay (白玩dev)',
    type: 'website',
  },
};

export default async function EnHomePage() {
  const result = await getHomeFeaturedPosts(5);
  const posts = result.success ? result.data : [];

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <SiteWelcome />
      </div>
      <HomeFeatured posts={posts} />
    </>
  );
}
