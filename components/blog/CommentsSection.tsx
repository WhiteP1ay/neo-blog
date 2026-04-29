'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createComment, getCommentsByPostId } from '@/server/actions/comments';
import type { CommentWithReplies } from '@/server/types/comments-thread';
import { useChinaIPDetector } from '@/hooks/useChinaIPDetector';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CommentItem } from './CommentItem';

interface CommentsSectionProps {
  postId: number;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { isChina, isChecking } = useChinaIPDetector();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    author: '',
    email: '',
    content: '',
  });
  const formRef = useRef<HTMLFormElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.author.trim() || !formData.content.trim()) {
      showToast('请填写昵称和评论内容', 'warning');
      return;
    }


    try {
      const result = await createComment({
        targetType: 'post',
        targetId: postId,
        parentId: replyingTo || null,
        author: formData.author,
        email: formData.email || undefined,
        content: formData.content,
      });

      if (result.success) {


        setFormData({ author: '', email: '', content: '' });
        setReplyingTo(null);
        await loadComments();
      } else {

        showToast(`评论提交失败: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('提交评论失败:', error);

      showToast('评论提交失败', 'error');
    }
  };

  const handleReply = useCallback(
    (commentId: number, author: string) => {

      setReplyingTo(commentId);
      setFormData((prev) => ({
        ...prev,
        content: `@${author} `,
      }));
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    },
    [],
  );

  if (isChecking) {
    return null;
  }

  if (isChina) {
    return null;
  }

  return (
    <section aria-label="评论">
      <header className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">评论</h2>
      </header>
      {loading ? (
        <div className="text-muted-foreground py-6 text-center text-sm sm:py-8 sm:text-base">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-muted-foreground py-6 text-center text-sm sm:py-8 sm:text-base">暂无评论</div>
      ) : (
        <div className="mb-6 sm:mb-8">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
          ))}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {replyingTo ? (
          <div className="bg-muted text-muted-foreground mb-3 rounded-md p-2 text-xs sm:mb-4 sm:p-3 sm:text-sm">
            正在回复评论，评论框中的 @用户名 会被保留
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <input
            type="text"
            placeholder="昵称 *"
            value={formData.author}
            onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
            required
            className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
          />
          <input
            type="email"
            placeholder="邮箱（可选）"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
          />
        </div>

        <Textarea
          placeholder="评论内容 *"
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          rows={4}
          required
        />

        <div className="flex items-center justify-between gap-2">
          {replyingTo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => {
                setReplyingTo(null);
                setFormData((prev) => ({ ...prev, content: '' }));
              }}
            >
              取消回复
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" className="ml-auto">
            提交评论
          </Button>
        </div>
      </form>
    </section>
  );
}

