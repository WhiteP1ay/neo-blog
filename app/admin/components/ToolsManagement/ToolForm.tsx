"use client";

import Image from "next/image";
import type { Tool } from "@/server/actions/tools";
import { useToolForm } from "./hooks/useToolForm";

interface ToolFormProps {
  tool: Tool | null;
  mode: "create" | "edit";
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * 工具表单组件（创建/编辑）
 */
export function ToolForm({ tool, mode, onSuccess, onCancel }: ToolFormProps) {
  const {
    name,
    setName,
    description,
    setDescription,
    coverImage,
    coverImageError,
    url,
    urlError,
    isHidden,
    setIsHidden,
    loading,
    handleCoverImageChange,
    handleUrlChange,
    handleImageError,
    handleSubmit,
  } = useToolForm({ tool, mode, onSuccess });

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
          {mode === "create" ? "创建工具" : "编辑工具"}
        </h2>

        {/* 工具名称 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工具名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* 工具描述 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工具描述（可选）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入工具描述..."
          />
        </div>

        {/* 工具链接URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工具链接URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              urlError && url
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
            placeholder="https://example.com/tool"
            required
          />
          {urlError && url && (
            <p className="text-xs text-red-600 mt-1">
              URL 格式无效，请输入完整的链接地址
            </p>
          )}
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

