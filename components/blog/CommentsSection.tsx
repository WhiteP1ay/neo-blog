'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createComment, getCommentsByPostId, type CommentWithReplies } from '@/server/actions/comments';
import { useChinaIPDetector } from '@/components/ChinaIPDetector';
import { useAnalytics } from '@/components/Analytics';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CommentItem } from '@/components/blog/CommentItem';

interface CommentsSectionProps {
  postId: number;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { isChina, isChecking } = useChinaIPDetector();
  const { track } = useAnalytics();
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

    track({
      type: 'comment',
      action: 'submit_comment',
      target: `post_${postId}`,
      metadata: {
        hasReply: !!replyingTo,
        replyToId: replyingTo,
      },
    });

    try {
      const result = await createComment({
        postId,
        parentId: replyingTo || null,
        author: formData.author,
        email: formData.email || undefined,
        content: formData.content,
      });

      if (result.success) {
        track({
          type: 'comment',
          action: 'submit_comment_success',
          target: `post_${postId}`,
        });

        setFormData({ author: '', email: '', content: '' });
        setReplyingTo(null);
        await loadComments();
      } else {
        track({
          type: 'comment',
          action: 'submit_comment_failed',
          target: `post_${postId}`,
          metadata: { error: result.error },
        });
        showToast(`评论提交失败: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      track({
        type: 'comment',
        action: 'submit_comment_error',
        target: `post_${postId}`,
      });
      showToast('评论提交失败', 'error');
    }
  };

  const handleReply = useCallback(
    (commentId: number, author: string) => {
      track({
        type: 'comment',
        action: 'click_reply',
        target: `comment_${commentId}`,
      });
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
    [track],
  );

  if (isChecking) {
    return null;
  }

  if (isChina) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">评论</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Input
              type="text"
              placeholder="昵称 *"
              value={formData.author}
              onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="邮箱（可选）"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
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
      </CardContent>
    </Card>
  );
}
