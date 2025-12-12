"use client";

import { useState, useEffect, useCallback } from "react";
import { getPostById, type Post } from "@/server/actions/posts";
import { getCommentsByPostId, deleteComment, type CommentWithReplies } from "@/server/actions/comments";
import { CodeHighlight } from "@/app/components/CodeHighlight";
import { useToast } from "@/app/components/Toast";

interface PostDetailProps {
  postId: number;
  onBack: () => void;
}

/**
 * 管理后台文章详情页组件
 * 复用c端的评论展示，但支持删除评论
 */
export function PostDetail({ postId, onBack }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const { showToast } = useToast();

  /**
   * 加载文章详情
   */
  const loadPost = useCallback(async () => {
    setLoading(true);
    const result = await getPostById(postId);
    if (result.success && result.data) {
      setPost(result.data);
    }
    setLoading(false);
  }, [postId]);

  /**
   * 加载评论列表
   */
  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    const result = await getCommentsByPostId(postId);
    if (result.success && result.data) {
      setComments(result.data);
    }
    setCommentsLoading(false);
  }, [postId]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  /**
   * 删除评论
   */
  const handleDeleteComment = async (id: number) => {
    if (!confirm("确定要删除这条评论吗？")) {
      return;
    }

    const result = await deleteComment(id);
    if (result.success) {
      showToast("删除成功", "success");
      loadComments();
    } else {
      showToast(`删除失败: ${result.error}`, "error");
    }
  };

  /**
   * 渲染评论树（带删除按钮）
   */
  const renderComment = (comment: CommentWithReplies) => {
    return (
      <div
        key={comment.id}
        className="mb-6 pb-6 border-b border-gray-200 last:border-0"
      >
        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {comment.author}
            </span>
            {comment.email && (
              <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2 break-all">
                ({comment.email})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
            </span>
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-xs sm:text-sm text-red-600 hover:text-red-800"
            >
              删除
            </button>
          </div>
        </div>
        <div className="text-sm sm:text-base text-gray-700 mb-3 whitespace-pre-wrap break-words">
          {comment.content}
        </div>

        {/* 渲染子评论 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 sm:mt-4 ml-2 sm:ml-6 pl-2 sm:pl-4 border-l-2 border-gray-200">
            {comment.replies.map((reply) => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">加载中...</div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12 text-gray-500">文章不存在</div>
    );
  }

  return (
    <div>
      {/* 返回按钮 */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="text-sm sm:text-base text-blue-600 hover:text-blue-800"
        >
          ← 返回文章列表
        </button>
      </div>

      {/* 文章内容 */}
      <article className="bg-white rounded-lg shadow-sm p-4 sm:p-8 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
          {post.title}
        </h1>
        <div className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
          {new Date(post.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div
          className="prose prose-sm sm:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* 代码高亮 */}
      <CodeHighlight />

      {/* 评论区域 */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">评论管理</h2>

        {commentsLoading ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">加载中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">暂无评论</div>
        ) : (
          <div>{comments.map(renderComment)}</div>
        )}
      </div>
    </div>
  );
}
