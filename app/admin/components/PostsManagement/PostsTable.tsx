"use client";

import type { Post } from "@/server/actions/posts";

interface PostsTableProps {
  posts: Post[];
  onEdit: (id: number) => void;
  onDownload: (post: Post) => void;
  onDelete: (id: number) => void;
  onUpdate: (post: Post) => void;
  onTogglePinned: (post: Post) => void;
}

/**
 * 文章表格组件（桌面端）
 */
export function PostsTable({
  posts,
  onEdit,
  onDownload,
  onDelete,
  onUpdate,
  onTogglePinned,
}: PostsTableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              标题
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              创建时间
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              置顶
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="px-4 sm:px-6 py-4">
                <button
                  onClick={() => onEdit(post.id)}
                  className="text-blue-600 hover:text-blue-800 text-left text-sm sm:text-base"
                >
                  {post.title}
                </button>
              </td>
              <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("zh-CN")
                  : "-"}
              </td>
              <td className="px-4 sm:px-6 py-4">
                <button
                  onClick={() => onTogglePinned(post)}
                  className={`text-xs sm:text-sm px-2 py-1 rounded ${
                    post.isPinned
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {post.isPinned ? "已置顶" : "置顶"}
                </button>
              </td>
              <td className="px-4 sm:px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onDownload(post)}
                    className="text-green-600 hover:text-green-800 text-xs sm:text-sm"
                  >
                    下载
                  </button>
                  <button
                    onClick={() => onUpdate(post)}
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                  >
                    更新
                  </button>
                  <button
                    onClick={() => onDelete(post.id)}
                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
