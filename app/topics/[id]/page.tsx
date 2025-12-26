import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTopicById, getTopics } from "@/server/actions/topics";
import { BackToHome } from "@/app/components/BackToHome";

export const revalidate = 60;

/**
 * 生成静态参数（用于静态生成）
 */
export async function generateStaticParams() {
  const result = await getTopics(false); // 不包含隐藏的专题
  const topics = result.success && result.data ? result.data : [];

  return topics.map((topic) => ({
    id: topic.id.toString(),
  }));
}

/**
 * 生成专题页面的 metadata（SEO优化）
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const topicId = parseInt(id, 10);

  if (isNaN(topicId)) {
    return {};
  }

  const result = await getTopicById(topicId);
  if (!result.success || !result.data) {
    return {};
  }

  const topic = result.data;

  return {
    title: topic.name,
    description: topic.description || `${topic.name} - 专题文章集合`,
    openGraph: {
      title: topic.name,
      description: topic.description || `${topic.name} - 专题文章集合`,
      type: "website",
      ...(topic.coverImage && { images: [topic.coverImage] }),
    },
  };
}

/**
 * 专题详情页面
 */
export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topicId = parseInt(id, 10);

  if (isNaN(topicId)) {
    notFound();
  }

  const result = await getTopicById(topicId);
  if (!result.success || !result.data) {
    notFound();
  }

  const topic = result.data;

  // 如果专题被隐藏，也返回 404
  if (topic.isHidden) {
    notFound();
  }

  const posts = topic.topicPosts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - 封面图区域 */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-linear-to-br from-blue-100 via-purple-100 to-pink-100">
        {topic.coverImage ? (
          <Image
            src={topic.coverImage}
            alt={topic.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-24 h-24 sm:w-32 sm:h-32 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

        {/* 内容区域 */}
        <div className="relative z-10 h-full flex flex-col justify-end">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-12">
            <div className="mb-4">
              <BackToHome className="text-white hover:text-blue-200" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              {topic.isPinned && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400/90 text-yellow-900 backdrop-blur-sm">
                  📌 置顶
                </span>
              )}
              <span className="text-sm text-white/80">
                {new Date(topic.createdAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {topic.name}
            </h1>
            {topic.description && (
              <p className="text-base sm:text-lg text-white/90 max-w-2xl leading-relaxed drop-shadow-md">
                {topic.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 文章列表区域 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            文章列表
          </h2>
          <p className="text-sm text-gray-500">共 {posts.length} 篇文章</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg">暂无文章</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {posts.map((topicPost) => {
              const post = topicPost.post;
              return (
                <Link
                  key={post.id}
                  href={`/${post.id}`}
                  className="block group"
                >
                  <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 sm:p-8 border border-gray-100 hover:border-blue-200">
                    <div className="flex items-start gap-4">
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        {post.createdAt && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <time
                              dateTime={new Date(post.createdAt).toISOString()}
                            >
                              {new Date(post.createdAt).toLocaleDateString(
                                "zh-CN",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </time>
                          </div>
                        )}
                      </div>

                      {/* 箭头图标 */}
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
