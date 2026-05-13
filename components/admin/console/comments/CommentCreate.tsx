'use client';

type CommentCreateProps = {
  open: boolean;
  onClose: () => void;
  form: {
    commentTargetType: 'post' | 'photo';
    setCommentTargetType: (value: 'post' | 'photo') => void;
    commentTargetId: string;
    setCommentTargetId: (value: string) => void;
    commentAuthor: string;
    setCommentAuthor: (value: string) => void;
    commentContent: string;
    setCommentContent: (value: string) => void;
    createComment: () => Promise<void>;
  };
};

export function CommentCreate({ open, onClose, form }: CommentCreateProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/70" type="button" aria-label="关闭新增评论弹窗" onClick={onClose} />
      <div className="relative w-full max-w-xl space-y-3 rounded border bg-background p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">新增评论</h3>
          <button className="rounded border px-2 py-1 text-xs" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="space-y-2">
          <select
            className="rounded border px-2 py-1"
            value={form.commentTargetType}
            onChange={(e) => form.setCommentTargetType(e.target.value as 'post' | 'photo')}
          >
            <option value="post">post</option>
            <option value="photo">photo</option>
          </select>
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="targetId"
            value={form.commentTargetId}
            onChange={(e) => form.setCommentTargetId(e.target.value)}
          />
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="作者"
            value={form.commentAuthor}
            onChange={(e) => form.setCommentAuthor(e.target.value)}
          />
          <textarea
            className="h-20 w-full rounded border px-2 py-1"
            placeholder="评论内容"
            value={form.commentContent}
            onChange={(e) => form.setCommentContent(e.target.value)}
          />
          <button
            className="rounded border px-3 py-1"
            type="button"
            onClick={async () => {
              await form.createComment();
              onClose();
            }}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
