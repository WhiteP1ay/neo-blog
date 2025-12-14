import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostById, getPosts } from "@/server/actions/posts";
import { CodeHighlight } from "@/app/components/CodeHighlight";
import { PostPageClient } from "@/app/components/PostPageClient";

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
  const description = textContent.length > 150 
    ? textContent.substring(0, 150) + "..." 
    : textContent || "阅读更多内容";

  const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : undefined;
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined;

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

  const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : undefined;
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined;

  // 结构化数据（JSON-LD）
  const jsonLd: {
    "@context": string;
    "@type": string;
    headline: string;
    datePublished?: string;
    dateModified?: string;
    author: { "@type": string; name: string };
    publisher: { "@type": string; name: string };
    description: string;
  } = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(publishedTime && { datePublished: publishedTime }),
    ...(modifiedTime && { dateModified: modifiedTime }),
    author: {
      "@type": "Person",
      name: "whitePlay",
    },
    publisher: {
      "@type": "Organization",
      name: "White Meta",
    },
    description: post.content.replace(/<[^>]*>/g, "").substring(0, 200),
  };

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
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

        {/* 代码高亮 */}
        <CodeHighlight />

          {/* 评论区域，由客户端组件自行判断是否显示 */}
          <PostPageClient postId={postId} />
        </div>
      </div>
    </>
  );
}
