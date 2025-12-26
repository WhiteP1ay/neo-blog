"use client";

import type { Post } from "@/server/actions/posts";

interface PostsCardListProps {
  posts: Post[];
  onEdit: (id: number) => void;
  onDownload: (post: Post) => void;
  onDelete: (id: number) => void;
  onUpdate: (post: Post) => void;
  onTogglePinned: (post: Post) => void;
}

/**
 * 文章卡片列表组件（移动端）
 */
export function PostsCardList({
  posts,
  onEdit,
  onDownload,
  onDelete,
  onUpdate,
  onTogglePinned,
}: PostsCardListProps) {
  return (
    <div className="sm:hidden divide-y divide-gray-200">
      {posts.map((post) => (
        <div key={post.id} className="p-4">
          <button
            onClick={() => onEdit(post.id)}
            className="text-blue-600 hover:text-blue-800 text-left font-medium mb-2 block w-full"
          >
            {post.title}
          </button>
          {post.createdAt && (
            <div className="text-xs text-gray-500 mb-3">
              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => onTogglePinned(post)}
              className={`text-xs px-2 py-1 rounded ${
                post.isPinned
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-600"
                  : "bg-gray-100 text-gray-600 border border-gray-300"
              }`}
            >
              {post.isPinned ? "已置顶" : "置顶"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onDownload(post)}
              className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
            >
              下载
            </button>
            <button
              onClick={() => onUpdate(post)}
              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-600 rounded"
            >
              更新
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-600 rounded"
            >
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
