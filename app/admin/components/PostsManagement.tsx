"use client";

import { useState, useRef } from "react";
import { deletePost, type Post } from "@/server/actions/posts";
import { PostDetail } from "./PostDetail";
import { useToast } from "@/app/components/Toast";

interface PostsManagementProps {
  posts: Post[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * 文章管理组件
 */
export function PostsManagement({ posts, loading, onRefresh }: PostsManagementProps) {
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  /**
   * 处理文件上传
   * @param file - 要上传的文件
   * @param postId - 可选的文章ID，如果提供则更新文章，否则创建新文章
   */
  const handleFileUpload = async (file: File, postId?: number) => {
    const formData = new FormData();
    formData.append("file", file);
    if (postId) {
      formData.append("postId", postId.toString());
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        showToast(postId ? "文章更新成功" : "文章创建成功", "success");
        onRefresh();
        setEditingPost(null);
      } else {
        showToast(`上传失败: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("上传失败:", error);
      showToast("上传失败", "error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".md")) {
      // 如果正在编辑文章，则更新；否则创建新文章
      handleFileUpload(file, editingPost?.id);
    } else {
      showToast("请选择.md文件", "warning");
    }
    // 重置文件输入，以便可以再次选择同一个文件
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".md")) {
      // 拖拽上传永远只创建新文章，不支持更新
      handleFileUpload(file);
    } else {
      showToast("请拖拽.md文件", "warning");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("确定要删除这篇文章吗？")) {
      return;
    }

    const result = await deletePost(id);
    if (result.success) {
      showToast("删除成功", "success");
      onRefresh();
    } else {
      showToast(`删除失败: ${result.error}`, "error");
    }
  };

  /**
   * 下载文章为Markdown
   */
  const handleDownloadPost = async (post: Post) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/download`);
      
      if (!response.ok) {
        // 尝试解析错误信息
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || "下载失败";
        showToast(errorMessage, "error");
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${post.title.replace(/[^\w\s-]/g, "").trim()}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("下载失败:", error);
      showToast("下载失败", "error");
    }
  };

  // 如果选择了文章，显示详情页
  if (selectedPostId) {
    return (
      <PostDetail
        postId={selectedPostId}
        onBack={() => setSelectedPostId(null)}
      />
    );
  }

  return (
    <div>
      {/* 上传区域 */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 mb-4 sm:mb-8 text-center hover:border-blue-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
          拖拽Markdown文件到这里创建新文章，或
          <button
            onClick={() => {
              setEditingPost(null); // 确保是创建新文章
              fileInputRef.current?.click();
            }}
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            点击选择文件
          </button>
        </p>
        {editingPost && (
          <p className="text-xs sm:text-sm text-gray-500 break-words">
            准备更新文章: {editingPost.title}
          </p>
        )}
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">暂无文章</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 桌面端：表格布局 */}
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
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => setSelectedPostId(post.id)}
                        className="text-blue-600 hover:text-blue-800 text-left text-sm sm:text-base"
                      >
                        {post.title}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDownloadPost(post)}
                          className="text-green-600 hover:text-green-800 text-xs sm:text-sm"
                        >
                          下载
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            fileInputRef.current?.click();
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                        >
                          更新
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
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

          {/* 移动端：卡片布局 */}
          <div className="sm:hidden divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <button
                  onClick={() => setSelectedPostId(post.id)}
                  className="text-blue-600 hover:text-blue-800 text-left font-medium mb-2 block w-full"
                >
                  {post.title}
                </button>
                <div className="text-xs text-gray-500 mb-3">
                  {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadPost(post)}
                    className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
                  >
                    下载
                  </button>
                  <button
                    onClick={() => {
                      setEditingPost(post);
                      fileInputRef.current?.click();
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-600 rounded"
                  >
                    更新
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-600 rounded"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

