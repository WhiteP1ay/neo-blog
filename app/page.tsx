import type { Metadata } from 'next';
import type { Post } from '@/server/types/models';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getHomeExplorerData, getPostById } from '@/server/actions/posts';
import { HomeExplorer } from '@/components/Home';
import { buildHomeSearchString, resolveHomePageSearchParams } from '@/app/home-search-params';
import { getSession } from '@/server/utils/auth';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; post?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const isAdminLoggedIn = session?.isAdmin === true;
  const explorerResult = await getHomeExplorerData();

  if (!explorerResult.success) {
    return (
      <div className="bg-muted/40 flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
          暂时无法加载内容，请稍后再试。
        </main>
      </div>
    );
  }

  const categories = explorerResult.data;
  const { activeTopicQuery, postId } = resolveHomePageSearchParams(sp, categories);

  let postDetail: Post | null = null;
  if (postId !== null) {
    const pr = await getPostById(postId, false);
    if (!pr.success || !pr.data) {
      redirect(`/?${buildHomeSearchString({ topic: activeTopicQuery })}`);
    }
    postDetail = pr.data;
  }

  const serializedCategories = categories.map((c) => ({
    topicKey: c.topicKey,
    name: c.name,
    isPinned: c.isPinned,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt?.toISOString() ?? null,
    posts: c.posts.map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt?.toISOString() ?? null,
      isPinned: p.isPinned,
    })),
  }));

  const serializedPost = postDetail
    ? {
      id: postDetail.id,
      title: postDetail.title,
      content: await highlightCodeBlocksInHtml(postDetail.content),
      contentSource: postDetail.content,
      createdAt: postDetail.createdAt?.toISOString() ?? null,
      updatedAt: postDetail.updatedAt?.toISOString() ?? null,
    }
    : null;

  return (
    <div className="bg-muted/40 flex min-h-screen flex-col">
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="h-dvh min-h-[420px] w-full min-w-0">
          <Suspense fallback={null}>
            <HomeExplorer
              categories={serializedCategories}
              activeTopicQuery={activeTopicQuery}
              activePostId={postId}
              postDetail={serializedPost}
              isAdminLoggedIn={isAdminLoggedIn}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
