"use client";

import Image from "next/image";
import type { Topic } from "@/server/actions/topics";
import { useTopicForm } from "./hooks/useTopicForm";
import { SortablePostList } from "./components/SortablePostList";
import { BatchUploadZone } from "./components/BatchUploadZone";

interface TopicFormProps {
  topic: Topic | null;
  mode: "create" | "edit";
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * 专题表单组件（创建/编辑）
 */
export function TopicForm({ topic, mode, onSuccess, onCancel }: TopicFormProps) {
  const {
    name,
    setName,
    description,
    setDescription,
    coverImage,
    coverImageError,
    isPinned,
    setIsPinned,
    isHidden,
    setIsHidden,
    allPosts,
    selectedPosts,
    loading,
    handleCoverImageChange,
    handleImageError,
    handlePostToggle,
    handlePostReorder,
    handleBatchAddPosts,
    handleSubmit,
  } = useTopicForm({ topic, mode, onSuccess });

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={onCancel}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← 返回列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === "create" ? "创建专题" : "编辑专题"}
        </h2>

        {/* 专题名称 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            专题名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* 专题描述 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            专题描述（可选）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入专题描述..."
          />
        </div>

        {/* 封面图 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            封面图 URL（可选）
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="url"
                value={coverImage || ""}
                onChange={(e) => handleCoverImageChange(e.target.value)}
                placeholder="请输入图片 URL，例如：https://example.com/image.jpg"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  coverImageError && coverImage
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              {coverImageError && coverImage && (
                <p className="text-xs text-red-600 mt-1">
                  URL 格式无效，请输入完整的图片地址
                </p>
              )}
            </div>
            {coverImage && !coverImageError && (
              <div className="shrink-0">
                <Image
                  src={coverImage}
                  alt="封面图预览"
                  width={150}
                  height={150}
                  className="rounded-lg object-cover border border-gray-300"
                  onError={handleImageError}
                />
              </div>
            )}
          </div>
        </div>

        {/* 置顶 */}
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">置顶</span>
          </label>
        </div>

        {/* 隐藏 */}
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isHidden}
              onChange={(e) => setIsHidden(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">隐藏</span>
          </label>
        </div>

        {/* 批量上传 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            批量上传文章
          </label>
          <BatchUploadZone onFilesUploaded={handleBatchAddPosts} />
        </div>

        {/* 文章管理 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文章管理
          </label>
          <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
            {allPosts.length === 0 ? (
              <p className="text-sm text-gray-500">暂无文章</p>
            ) : (
              <div className="space-y-2">
                {allPosts.map((post) => {
                  const isSelected = selectedPosts.some((p) => p.postId === post.id);
                  return (
                    <label
                      key={post.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePostToggle(post.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{post.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <SortablePostList
            posts={selectedPosts}
            allPosts={allPosts}
            onReorder={handlePostReorder}
            onRemove={handlePostToggle}
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "保存中..." : mode === "create" ? "创建" : "更新"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
