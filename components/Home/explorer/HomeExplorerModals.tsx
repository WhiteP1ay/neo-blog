'use client';

/**
 * Home Explorer 弹层集合（新建/重命名/删除：专题与文章）。
 *
 * 说明：
 * - “开关与输入状态”来自 admin ui store
 * - “提交动作”由上层 hook 注入（便于复用/测试）
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHomeExplorerAdminUiStore } from '../store/home-explorer-admin-ui-store';

type HomeExplorerModalsProps = {
  submitNewTopic: () => void | Promise<void>;
  submitRenameTopic: () => void | Promise<void>;
  submitDeleteTopic: () => void | Promise<void>;
  submitRenamePost: () => void | Promise<void>;
  submitDeletePost: () => void | Promise<void>;
};

export function HomeExplorerModals({
  submitNewTopic,
  submitRenameTopic,
  submitDeleteTopic,
  submitRenamePost,
  submitDeletePost,
}: HomeExplorerModalsProps) {
  const newTopicOpen = useHomeExplorerAdminUiStore((s) => s.newTopicOpen);
  const setNewTopicOpen = useHomeExplorerAdminUiStore((s) => s.setNewTopicOpen);
  const newTopicName = useHomeExplorerAdminUiStore((s) => s.newTopicName);
  const setNewTopicName = useHomeExplorerAdminUiStore((s) => s.setNewTopicName);

  const renameTopicState = useHomeExplorerAdminUiStore((s) => s.renameTopicState);
  const setRenameTopicState = useHomeExplorerAdminUiStore((s) => s.setRenameTopicState);
  const deleteTopicId = useHomeExplorerAdminUiStore((s) => s.deleteTopicId);
  const setDeleteTopicId = useHomeExplorerAdminUiStore((s) => s.setDeleteTopicId);

  const renamePostState = useHomeExplorerAdminUiStore((s) => s.renamePostState);
  const setRenamePostState = useHomeExplorerAdminUiStore((s) => s.setRenamePostState);
  const deletePostId = useHomeExplorerAdminUiStore((s) => s.deletePostId);
  const setDeletePostId = useHomeExplorerAdminUiStore((s) => s.setDeletePostId);

  return (
    <>
      <Dialog open={newTopicOpen} onOpenChange={setNewTopicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建专题</DialogTitle>
            <DialogDescription>在当前窗口中新增一个专题文件夹。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="home-new-topic-name">名称</Label>
            <Input
              id="home-new-topic-name"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="例如：随笔"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitNewTopic();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewTopicOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => void submitNewTopic()}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTopicState !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTopicState(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名专题</DialogTitle>
          </DialogHeader>
          {renameTopicState ? (
            <>
              <div className="space-y-2 py-2">
                <Label htmlFor="home-rename-topic">名称</Label>
                <Input
                  id="home-rename-topic"
                  value={renameTopicState.name}
                  onChange={(e) => setRenameTopicState({ ...renameTopicState, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitRenameTopic();
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRenameTopicState(null)}>
                  取消
                </Button>
                <Button type="button" onClick={() => void submitRenameTopic()}>
                  保存
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTopicId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTopicId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除专题？</AlertDialogTitle>
            <AlertDialogDescription>专题与文章的关联会解除，文章不会删除，将出现在「未分类」中。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitDeleteTopic()}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={renamePostState !== null}
        onOpenChange={(open) => {
          if (!open) setRenamePostState(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名文章</DialogTitle>
          </DialogHeader>
          {renamePostState ? (
            <>
              <div className="space-y-2 py-2">
                <Label htmlFor="home-rename-post">标题</Label>
                <Input
                  id="home-rename-post"
                  value={renamePostState.title}
                  onChange={(e) => setRenamePostState({ ...renamePostState, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitRenamePost();
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRenamePostState(null)}>
                  取消
                </Button>
                <Button type="button" onClick={() => void submitRenamePost()}>
                  保存
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletePostId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePostId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除文章？</AlertDialogTitle>
            <AlertDialogDescription>将永久删除该文章及其评论，且不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitDeletePost()}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

