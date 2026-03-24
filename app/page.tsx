import type { Metadata } from 'next';
import { getLatestPostsForHome } from '@/server/actions/posts';
import { HomeRecentPosts } from '@/app/components/Home/HomeRecentPosts';
import { HomeProfileAside } from '@/app/components/Home/HomeProfileAside';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'White Meta',
  description: '白玩dev的个人网站',
  keywords: ['博客', '技术文章', '编程', '开发', '工具', '简历编辑器', '面试题库'],
  openGraph: {
    title: 'White Meta',
    description: '白玩dev的个人网站',
    type: 'website',
  },
};


export default async function Home() {
  const result = await getLatestPostsForHome(5);
  const posts = result.success ? result.data : [];

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <main className="h-[calc(100vh-80px)]">
        <div className="">
          <HomeRecentPosts posts={posts} />
          <HomeProfileAside />
        </div>
      </main>
    </div>
  );
}
