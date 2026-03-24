'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPostById, type Post } from '@/server/actions/posts';
import { getCommentsByPostId, deleteComment, type CommentWithReplies } from '@/server/actions/comments';
import { CodeHighlight } from '@/app/components/CodeHighlight';
import { useToast } from '@/app/components/Toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

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
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const confirmDeleteComment = async () => {
    if (deleteTargetId == null) {
      return;
    }
    setDeleteLoading(true);
    const result = await deleteComment(deleteTargetId);
    setDeleteLoading(false);
    setDeleteTargetId(null);
    if (result.success) {
      showToast('删除成功', 'success');
      loadComments();
    } else {
      showToast(`删除失败: ${result.error}`, 'error');
    }
  };

  /**
   * 渲染评论树（带删除按钮）
   */
  const renderComment = (comment: CommentWithReplies) => {
    return (
      <div key={comment.id} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">{comment.author}</span>
            {comment.email && (
              <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2 break-all">({comment.email})</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive text-xs sm:text-sm"
              onClick={() => setDeleteTargetId(comment.id)}
            >
              删除
            </Button>
          </div>
        </div>
        <div className="text-sm sm:text-base text-gray-700 mb-3 whitespace-pre-wrap wrap-break-word">
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
    return <div className="text-muted-foreground py-12 text-center">加载中...</div>;
  }

  if (!post) {
    return <div className="text-muted-foreground py-12 text-center">文章不存在</div>;
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <Button variant="link" className="h-auto p-0 text-primary" onClick={onBack}>
          ← 返回文章列表
        </Button>
      </div>

      <Card className="mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-8">
          <article>
            <h1 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-4xl">{post.title}</h1>
            {post.createdAt ? (
              <div className="text-muted-foreground mb-6 text-xs sm:mb-8 sm:text-sm">
                {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            ) : null}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </CardContent>
      </Card>

      <CodeHighlight />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">评论管理</CardTitle>
        </CardHeader>
        <CardContent>
          {commentsLoading ? (
            <div className="text-muted-foreground py-6 text-center text-sm sm:py-8 sm:text-base">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm sm:py-8 sm:text-base">暂无评论</div>
          ) : (
            <div>{comments.map(renderComment)}</div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除评论？</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>取消</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteLoading} onClick={() => void confirmDeleteComment()}>
              {deleteLoading ? '删除中…' : '删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
