import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostById, getPosts } from "@/server/actions/posts";
import {
  getTopicsByPostId,
  getTopicPostNavigation,
} from "@/server/actions/topics";
import { CodeHighlight } from "@/app/components/CodeHighlight";
import { PostPageClient } from "@/app/components/PostPageClient";
import { PostNavigation } from "@/app/components/PostNavigation";
import { TableOfContents } from "@/app/components/TableOfContents";
import { BackToHome } from "@/app/components/BackToHome";
import { StructuredData, createBlogPostingSchema } from "@/app/components/StructuredData";

export async function generateStaticParams() {
  const result = await getPosts();
  const posts = result.success && result.data ? result.data : [];

  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}

export const revalidate = 60;

/**
 * 生成文章页面的metadata（SEO优化）
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return {};
  }

  const result = await getPostById(postId);
  if (!result.success || !result.data) {
    return {};
  }

  const post = result.data;

  // 从HTML内容中提取纯文本作为描述（前150个字符）
  const textContent = post.content.replace(/<[^>]*>/g, "").trim();
  const description =
    textContent.length > 150
      ? textContent.substring(0, 150) + "..."
      : textContent || "阅读更多内容";

  const publishedTime = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : undefined;
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : undefined;

  return {
    title: post.title,
    description,
    keywords: [post.title, "博客", "技术文章"],
    authors: [{ name: "whitePlay" }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      authors: ["whitePlay"],
      siteName: "White Meta",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
    alternates: {
      canonical: `/${postId}`,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    notFound();
  }

  const result = await getPostById(postId);
  if (!result.success || !result.data) {
    notFound();
  }

  const post = result.data;

  // 获取文章所属的专题
  const topicsResult = await getTopicsByPostId(postId);
  const topics =
    topicsResult.success && topicsResult.data ? topicsResult.data : [];

  // 获取专题导航（如果有专题，使用第一个专题的导航）
  type Navigation = {
    prev: { id: number; title: string } | null;
    next: { id: number; title: string } | null;
  };
  let navigation: Navigation = { prev: null, next: null };
  if (topics.length > 0) {
    const navResult = await getTopicPostNavigation(topics[0].id, postId);
    if (navResult.success && navResult.data) {
      navigation = navResult.data;
    }
  }

  const publishedTime = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : undefined;
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : undefined;

  // 结构化数据（JSON-LD）
  const jsonLd = createBlogPostingSchema({
    headline: post.title,
    description: post.content.replace(/<[^>]*>/g, "").substring(0, 200),
    datePublished: publishedTime,
    dateModified: modifiedTime,
  });

  return (
    <>
      {/* 结构化数据 */}
      <StructuredData data={jsonLd} />
      <div className="min-h-screen bg-gray-50">
        {/* 目录组件 */}
        <TableOfContents content={post.content} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          {/* 返回首页按钮（顶部） */}
          <div className="mb-4">
            <BackToHome />
          </div>

          <article className="bg-white rounded-lg shadow-sm p-4 sm:p-8 mb-6 sm:mb-8">
            <header>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                {post.title}
              </h1>
              {post.createdAt && (
                <time
                  dateTime={publishedTime}
                  className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 block"
                >
                  {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </header>
            <div
              className="prose prose-sm sm:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* 文章导航（上一篇/下一篇） */}
          {navigation.prev || navigation.next ? (
            <PostNavigation prev={navigation.prev} next={navigation.next} />
          ) : null}

          {/* 代码高亮 */}
          <CodeHighlight />

          {/* 评论区域，由客户端组件自行判断是否显示 */}
          <PostPageClient postId={postId} />
        </div>
      </div>
    </>
  );
}
