"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getCommentsByPostId,
  type CommentWithReplies,
} from "@/server/actions/comments";
import { useChinaIPDetector } from "./ChinaIPDetector";
import { useAnalytics } from "./Analytics";
import { useToast } from "./Toast";
import { CommentItem } from "./CommentItem";

interface CommentsSectionProps {
  postId: number;
}

/**
 * 评论区域组件
 */
export function CommentsSection({ postId }: CommentsSectionProps) {
  const { isChina, isChecking } = useChinaIPDetector();
  const { track } = useAnalytics();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    author: "",
    email: "",
    content: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  /**
   * 加载评论列表
   */
  const loadComments = useCallback(async () => {
    setLoading(true);
    const result = await getCommentsByPostId(postId);
    if (result.success && result.data) {
      setComments(result.data);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  /**
   * 处理提交评论
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.author.trim() || !formData.content.trim()) {
      showToast("请填写昵称和评论内容", "warning");
      return;
    }

    // 埋点：评论提交
    track({
      type: "comment",
      action: "submit_comment",
      target: `post_${postId}`,
      metadata: {
        hasReply: !!replyingTo,
        replyToId: replyingTo,
      },
    });

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          parentId: replyingTo || null,
          author: formData.author,
          email: formData.email || undefined,
          content: formData.content,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // 埋点：评论提交成功
        track({
          type: "comment",
          action: "submit_comment_success",
          target: `post_${postId}`,
        });

        // 重置表单
        setFormData({ author: "", email: "", content: "" });
        setReplyingTo(null);
        // 重新加载评论
        await loadComments();
      } else {
        // 埋点：评论提交失败
        track({
          type: "comment",
          action: "submit_comment_failed",
          target: `post_${postId}`,
          metadata: { error: result.error },
        });
        showToast(`评论提交失败: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("提交评论失败:", error);
      // 埋点：评论提交异常
      track({
        type: "comment",
        action: "submit_comment_error",
        target: `post_${postId}`,
      });
      showToast("评论提交失败", "error");
    }
  };

  /**
   * 处理回复按钮点击
   */
  const handleReply = useCallback((commentId: number, author: string) => {
    // 埋点：点击回复按钮
    track({
      type: "comment",
      action: "click_reply",
      target: `comment_${commentId}`,
    });
    setReplyingTo(commentId);
    setFormData((prev) => ({
      ...prev,
      content: `@${author} `,
    }));
    // 滚动到底部输入框
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, [track]);

  // 如果检测中，默认隐藏评论功能（不显示任何内容）
  if (isChecking) {
    return null;
  }

  // 如果检测到在中国，隐藏评论功能
  if (isChina) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">评论</h2>

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">暂无评论</div>
      ) : (
        <div className="mb-6 sm:mb-8">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* 评论表单 */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {replyingTo && (
          <div className="bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
            正在回复评论，评论框中的 @用户名 会被保留
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="昵称 *"
            value={formData.author}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, author: e.target.value }))
            }
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="邮箱（可选）"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <textarea
          placeholder="评论内容 *"
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, content: e.target.value }))
          }
          rows={4}
          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <div className="flex items-center justify-between gap-2">
          {replyingTo && (
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setFormData((prev) => ({ ...prev, content: "" }));
              }}
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
            >
              取消回复
            </button>
          )}
          <button
            type="submit"
            className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors ml-auto"
          >
            提交评论
          </button>
        </div>
      </form>
    </div>
  );
}
