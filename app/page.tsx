import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  getHomeExplorerData,
  getLatestPostsForHome,
  getPostById,
  type Post,
} from '@/server/actions/posts';
import { HomeExplorer } from '@/components/Home/HomeExplorer';
import { HomeMobileFallback } from '@/components/Home/HomeMobileFallback';
import { SITE_SHEET_QUERY_KEY, isSiteSheetModalId } from '@/app/nav';
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

function topicToSearchValue(key: 'uncategorized' | number): string {
  return key === 'uncategorized' ? 'uncategorized' : String(key);
}

/** 首页 redirect 时保留合法的 sheet 查询（与弹窗同步） */
function buildHomeSearchString(opts: { topic: string; post?: number; sheet?: string }) {
  const q = new URLSearchParams();
  q.set('topic', opts.topic);
  if (opts.post != null) {
    q.set('post', String(opts.post));
  }
  if (opts.sheet != null && isSiteSheetModalId(opts.sheet)) {
    q.set(SITE_SHEET_QUERY_KEY, opts.sheet);
  }
  return q.toString();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; post?: string; sheet?: string }>;
}) {
  const sp = await searchParams;
  const sheetPreserve = sp.sheet;
  const adminSession = await getSession();
  const isAdminLoggedIn = adminSession != null;
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

  if (sp.topic && sp.topic !== 'uncategorized') {
    const n = parseInt(sp.topic, 10);
    if (Number.isNaN(n)) {
      redirect(`/?${buildHomeSearchString({ topic: 'uncategorized', sheet: sheetPreserve })}`);
    }
    const found = categories.find((c) => c.topicKey === n);
    if (!found) {
      redirect(`/?${buildHomeSearchString({ topic: 'uncategorized', sheet: sheetPreserve })}`);
    }
  }

  let topicKey: 'uncategorized' | number = 'uncategorized';
  if (sp.topic && sp.topic !== 'uncategorized') {
    const n = parseInt(sp.topic, 10);
    const found = categories.find((c) => c.topicKey === n);
    if (found) {
      topicKey = n;
    }
  }

  const activeTopicQuery = topicToSearchValue(topicKey);
  const currentCat = categories.find((c) => c.topicKey === topicKey) ?? categories[0];

  let postId: number | null = null;
  if (sp.post) {
    const p = parseInt(sp.post, 10);
    if (Number.isNaN(p)) {
      redirect(`/?${buildHomeSearchString({ topic: activeTopicQuery, sheet: sheetPreserve })}`);
    }
    if (!currentCat.posts.some((x) => x.id === p)) {
      redirect(`/?${buildHomeSearchString({ topic: activeTopicQuery, sheet: sheetPreserve })}`);
    }
    postId = p;
  }

  let postDetail: Post | null = null;
  if (postId !== null) {
    const pr = await getPostById(postId, false);
    if (!pr.success || !pr.data) {
      redirect(`/?${buildHomeSearchString({ topic: activeTopicQuery, sheet: sheetPreserve })}`);
    }
    postDetail = pr.data;
  }

  const recentResult = await getLatestPostsForHome(5);
  const recentPosts = recentResult.success ? recentResult.data : [];

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
        <div className="hidden h-dvh min-h-[420px] w-full min-w-0 lg:block">
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
        <div className="px-4 py-6 lg:hidden">
          <HomeMobileFallback posts={recentPosts} />
        </div>
      </main>
    </div>
  );
}
