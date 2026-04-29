'use client';

import { useRouter } from 'next/navigation';
import type { HomeExplorerPostDetailPayload } from '@/types/admin/payload';
import { Footer } from './Footer';
import { Header } from './Header';
import { ExplorerSettingsLayer } from './ExplorerSettingsLayer';
import { TopicPanel } from './TopicPanel';
import { ReadingPane } from './ReadingPane';
import { useToast } from '@/components/Toast';
import type { ExplorerTreeNode } from '@/server/types/explorer-tree';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { deleteExplorerNode, updateExplorerNode } from '@/server/actions/explorer-nodes';
import Image from 'next/image';

interface HomeExplorerProps {
  tree: ExplorerTreeNode[];
  selectedNode: ExplorerTreeNode | null;
  postDetail: HomeExplorerPostDetailPayload | null;
  isAdminLoggedIn: boolean;
}

function NodePreviewPane({
  selectedNode,
  postDetail,
  refreshExplorer,
  showToast,
  navigateNode,
}: {
  selectedNode: ExplorerTreeNode | null;
  postDetail: HomeExplorerPostDetailPayload | null;
  refreshExplorer: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  navigateNode: (id: number) => void;
}) {
  if (!selectedNode) {
    return <section className="bg-card min-h-0 min-w-0 flex-1 rounded-md border p-4 text-sm text-muted-foreground">请选择一个节点</section>;
  }

  const handleDelete = async () => {
    if (!window.confirm(`确认删除「${selectedNode.name}」？`)) return;
    const r = await deleteExplorerNode(selectedNode.id);
    if (!r.success) return showToast(r.error, 'error');
    showToast('已删除', 'success');
    refreshExplorer();
  };

  const previewBody =
    selectedNode.nodeType === 'markdown' ? (
      <ReadingPane postDetail={postDetail} isAdminLoggedIn={true} onSavedEdit={refreshExplorer} onCancelEdit={() => undefined} />
    ) : selectedNode.nodeType === 'photo' ? (
      <section className="bg-card min-h-0 min-w-0 flex-1 rounded-md border p-4">
        <div className="mb-3 text-sm font-medium">{selectedNode.name}</div>
        {selectedNode.fileUrl ? (
          <div className="relative h-[420px] w-full overflow-hidden rounded-md bg-muted/30">
            <Image src={selectedNode.fileUrl} alt={selectedNode.name} fill className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">图片地址为空</div>
        )}
      </section>
    ) : (
      null
    );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-lg">
          {previewBody}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={async () => {
            const name = window.prompt('重命名', selectedNode.name)?.trim();
            if (!name || name === selectedNode.name) return;
            const r = await updateExplorerNode(selectedNode.id, { name });
            if (!r.success) return showToast(r.error, 'error');
            refreshExplorer();
            navigateNode(selectedNode.id);
          }}
        >
          重命名
        </ContextMenuItem>
        <ContextMenuItem
          onClick={async () => {
            const r = await updateExplorerNode(selectedNode.id, { isHidden: !selectedNode.isHidden });
            if (!r.success) return showToast(r.error, 'error');
            refreshExplorer();
          }}
        >
          {selectedNode.isHidden ? '取消隐藏' : '设为隐藏'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={async () => {
            const r = await updateExplorerNode(selectedNode.id, { allowComment: !selectedNode.allowComment });
            if (!r.success) return showToast(r.error, 'error');
            refreshExplorer();
          }}
        >
          {selectedNode.allowComment ? '关闭评论' : '开启评论'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={() => void handleDelete()}>
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function HomeExplorer({ tree, selectedNode, postDetail, isAdminLoggedIn }: HomeExplorerProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const navigateNode = (nodeId: number) => {
    const q = new URLSearchParams();
    q.set('node', String(nodeId));
    router.replace(`/admin?${q.toString()}`);
  };

  const refreshExplorer = () => {
    router.refresh();
  };

  return (
    <div className="bg-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <Header isAdminLoggedIn={isAdminLoggedIn} />
      <div className="bg-muted/25 flex min-h-0 flex-1 gap-2.5 p-2.5 dark:bg-muted/20">
        <TopicPanel
          tree={tree}
          selectedNodeId={selectedNode?.id ?? null}
          isAdminLoggedIn={isAdminLoggedIn}
          refreshExplorer={refreshExplorer}
          showToast={showToast}
          navigateNode={navigateNode}
        />
        <NodePreviewPane selectedNode={selectedNode} postDetail={postDetail} refreshExplorer={refreshExplorer} showToast={showToast} navigateNode={navigateNode} />
      </div>
      <Footer />
      <ExplorerSettingsLayer isAdminLoggedIn={isAdminLoggedIn} />
    </div>
  );
}

