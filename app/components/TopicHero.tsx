import Image from "next/image";
import type { Topic } from "@/server/actions/topics";
import { Breadcrumb } from "./Breadcrumb";
import { formatDate } from "@/app/utils/date";

interface TopicHeroProps {
  topic: Topic;
}

/**
 * 专题详情页 Hero Section 组件
 */
export function TopicHero({ topic }: TopicHeroProps) {
  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* 内容区域 */}
      <div className="relative z-10 h-full flex flex-col justify-end">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-12">
          <div className="mb-4 [&_*]:text-white/80 [&_a]:hover:text-white">
            <Breadcrumb currentLabel={topic.name} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            {topic.isPinned && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400/90 text-yellow-900 backdrop-blur-sm">
                📌 置顶
              </span>
            )}
            <span className="text-sm text-white/80">
              {formatDate(topic.createdAt)}
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
  );
}

