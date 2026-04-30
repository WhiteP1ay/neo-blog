'use client';

import * as React from 'react';
import { ChevronRight, FileImage, FileText, FolderClosed, Plus, Upload } from 'lucide-react';
import { TopicPanelHeader } from './TopicPanelHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent } from '../../ui/collapsible';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { MAX_SIDEBAR_PX, MIN_SIDEBAR_PX, TOPIC_RAIL_PX } from '@/constants/admin/layout';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@/stores/admin/layout';
import type { ExplorerTreeNode } from '@/server/types/explorer-tree';
import {
  createFolder,
  createMarkdownFile,
  deleteExplorerNodesBatch,
  getRootNodeId,
  moveExplorerNodes,
  patchExplorerNodesBatch,
  updateExplorerNode,
} from '@/server/actions/explorer-nodes';
import {
  applyNodePatch,
  buildNodeMap,
  moveNodesToFolder,
  removeNodes,
  reorderWithinParent,
} from '@/utils/admin/explorer-tree-client';

type TopicPanelProps = {
  tree: ExplorerTreeNode[];
  selectedNodeId: number | null;
  isAdminLoggedIn: boolean;
  refreshExplorer: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  navigateNode: (nodeId: number) => void;
};

type TreeItemProps = {
  node: ExplorerTreeNode;
  depth: number;
  selectedIds: Set<number>;
  lastSelectedId: number | null;
  treeMap: Map<number, ExplorerTreeNode>;
  expandedSet: Set<number>;
  setExpandedSet: React.Dispatch<React.SetStateAction<Set<number>>>;
  onSelect: (nodeId: number, event: React.MouseEvent<HTMLButtonElement>) => void;
  onContextSelect: (nodeId: number) => void;
  onAfterChange: (nextTree: ExplorerTreeNode[]) => void;
  onSync: () => void;
  localTree: ExplorerTreeNode[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  setUploadParentId: (id: number | null) => void;
  onNodeDragStart: (nodeId: number, event: React.DragEvent<HTMLDivElement>) => void;
  onNodeDragOver: (nodeId: number, event: React.DragEvent<HTMLDivElement>) => void;
  onNodeDrop: (nodeId: number, event: React.DragEvent<HTMLDivElement>) => void;
  onOpenMoveDialog: (nodeId: number) => void;
};

function TreeItem({
  node,
  depth,
  selectedIds,
  lastSelectedId,
  treeMap,
  expandedSet,
  setExpandedSet,
  onSelect,
  onContextSelect,
  onAfterChange,
  onSync,
  localTree,
  showToast,
  uploadInputRef,
  setUploadParentId,
  onNodeDragStart,
  onNodeDragOver,
  onNodeDrop,
  onOpenMoveDialog,
}: TreeItemProps) {
  const isFolder = node.nodeType === 'folder';
  const isOpen = expandedSet.has(node.id);
  const isSelected = selectedIds.has(node.id);

  const toggleOpen = () => {
    if (!isFolder) return;
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  const icon =
    node.nodeType === 'folder' ? <FolderClosed className="size-3.5 text-muted-foreground" /> : node.nodeType === 'markdown' ? <FileText className="size-3.5 text-muted-foreground" /> : <FileImage className="size-3.5 text-muted-foreground" />;

  const handleCreateFolder = async () => {
    const name = window.prompt('新建文件夹', '新建文件夹')?.trim();
    if (!name) return;
    const r = await createFolder(node.id, name);
    if (!r.success) return showToast(r.error, 'error');
    showToast('已创建文件夹', 'success');
    onSync();
    setExpandedSet((prev) => new Set(prev).add(node.id));
  };

  const handleCreateMarkdown = async () => {
    const name = window.prompt('新建 Markdown 文件', '未命名.md')?.trim();
    if (!name) return;
    const r = await createMarkdownFile(node.id, name.endsWith('.md') ? name : `${name}.md`);
    if (!r.success) return showToast(r.error, 'error');
    showToast('已创建 Markdown', 'success');
    onSync();
    setExpandedSet((prev) => new Set(prev).add(node.id));
  };

  const handleUploadPhoto = () => {
    setUploadParentId(node.id);
    uploadInputRef.current?.click();
  };

  const handleRename = async () => {
    const name = window.prompt('重命名', node.name)?.trim();
    if (!name || name === node.name) return;
    const r = await updateExplorerNode(node.id, { name });
    if (!r.success) return showToast(r.error, 'error');
    showToast('已重命名', 'success');
    onSync();
  };

  const handleToggleHidden = async () => {
    const ids = isSelected ? [...selectedIds] : [node.id];
    const targetValue = !node.isHidden;
    const snapshot = localTree;
    const optimistic = applyNodePatch(localTree, ids, { isHidden: targetValue });
    onAfterChange(optimistic);
    const r = await patchExplorerNodesBatch({ nodeIds: ids, isHidden: targetValue });
    if (!r.success) {
      onAfterChange(snapshot);
      return showToast(r.error, 'error');
    }
    showToast(targetValue ? '已隐藏' : '已取消隐藏', 'success');
    onSync();
  };

  const handleToggleComment = async () => {
    const ids = isSelected ? [...selectedIds] : [node.id];
    const targetValue = !node.allowComment;
    const snapshot = localTree;
    const optimistic = applyNodePatch(localTree, ids, { allowComment: targetValue });
    onAfterChange(optimistic);
    const r = await patchExplorerNodesBatch({ nodeIds: ids, allowComment: targetValue });
    if (!r.success) {
      onAfterChange(snapshot);
      return showToast(r.error, 'error');
    }
    showToast(targetValue ? '已开启评论' : '已关闭评论', 'success');
    onSync();
  };

  const handleDelete = async () => {
    const ids = isSelected ? [...selectedIds] : [node.id];
    if (!window.confirm(`确认删除 ${ids.length > 1 ? `${ids.length} 个项目` : `「${node.name}」`}？`)) return;
    const snapshot = localTree;
    onAfterChange(removeNodes(localTree, ids));
    const r = await deleteExplorerNodesBatch({ nodeIds: ids });
    if (!r.success) {
      onAfterChange(snapshot);
      return showToast(r.error, 'error');
    }
    showToast('已删除', 'success');
    onSync();
  };

  const parentId = node.parentId;
  const canRangeSelect = parentId != null && lastSelectedId != null && treeMap.get(lastSelectedId)?.parentId === parentId;

  const handleNodeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.shiftKey && !canRangeSelect) {
      showToast('Shift 范围选择仅支持同一父目录', 'warning');
      return;
    }
    onSelect(node.id, event);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            draggable
            role="treeitem"
            tabIndex={0}
            onDragStart={(event) => onNodeDragStart(node.id, event)}
            onDragOver={(event) => onNodeDragOver(node.id, event)}
            onDrop={(event) => onNodeDrop(node.id, event)}
            onContextMenu={() => onContextSelect(node.id)}
            className={cn('group flex h-7 items-center rounded-md px-2 text-sm', isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/35')}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            {isFolder ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOpen();
                }}
                className="mr-1 rounded p-0.5 hover:bg-accent/50"
              >
                <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
              </button>
            ) : (
              <span className="mr-1 inline-block w-[18px]" />
            )}
            {icon}
            <button type="button" className="ml-1 min-w-0 flex-1 truncate text-left" onClick={handleNodeClick}>
              {node.name}
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isFolder ? (
            <>
              <ContextMenuItem onClick={() => void handleCreateFolder()}>
                <Plus className="mr-2 size-4" />
                新建文件夹
              </ContextMenuItem>
              <ContextMenuItem onClick={() => void handleCreateMarkdown()}>
                <FileText className="mr-2 size-4" />
                新建 Markdown
              </ContextMenuItem>
              <ContextMenuItem onClick={handleUploadPhoto}>
                <Upload className="mr-2 size-4" />
                上传图片
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          ) : null}
          {selectedIds.size > 1 && isSelected ? (
            <>
              <ContextMenuItem onClick={() => onOpenMoveDialog(node.id)}>批量移动到目录</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => void handleToggleHidden()}>批量{node.isHidden ? '取消隐藏' : '设为隐藏'}</ContextMenuItem>
              <ContextMenuItem onClick={() => void handleToggleComment()}>批量{node.allowComment ? '关闭评论' : '开启评论'}</ContextMenuItem>
              <ContextMenuSeparator />
            </>
          ) : null}
          <ContextMenuItem onClick={() => void handleRename()}>重命名</ContextMenuItem>
          <ContextMenuItem onClick={() => void handleToggleHidden()}>{node.isHidden ? '取消隐藏' : '设为隐藏'}</ContextMenuItem>
          <ContextMenuItem onClick={() => void handleToggleComment()}>{node.allowComment ? '关闭评论' : '开启评论'}</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onClick={() => void handleDelete()}>
            删除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isFolder ? (
        <Collapsible open={isOpen} onOpenChange={() => toggleOpen()}>
          <CollapsibleContent className="space-y-0.5">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                  selectedIds={selectedIds}
                  lastSelectedId={lastSelectedId}
                  treeMap={treeMap}
                expandedSet={expandedSet}
                setExpandedSet={setExpandedSet}
                  onSelect={onSelect}
                  onContextSelect={onContextSelect}
                  onAfterChange={onAfterChange}
                  onSync={onSync}
                  localTree={localTree}
                showToast={showToast}
                uploadInputRef={uploadInputRef}
                setUploadParentId={setUploadParentId}
                  onNodeDragStart={onNodeDragStart}
                  onNodeDragOver={onNodeDragOver}
                  onNodeDrop={onNodeDrop}
                  onOpenMoveDialog={onOpenMoveDialog}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

export function TopicPanel({ tree, selectedNodeId, isAdminLoggedIn, refreshExplorer, showToast, navigateNode }: TopicPanelProps) {
  const sidebarPx = useLayoutStore((s) => s.sidebarPx);
  const setSidebarPx = useLayoutStore((s) => s.setSidebarPx);
  const topicPanelExpanded = useLayoutStore((s) => s.topicPanelExpanded);
  const setTopicPanelExpanded = useLayoutStore((s) => s.setTopicPanelExpanded);
  const [search, setSearch] = React.useState('');
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadParentId, setUploadParentId] = React.useState<number | null>(null);
  const [expandedSet, setExpandedSet] = React.useState<Set<number>>(new Set());
  const [localTree, setLocalTree] = React.useState<ExplorerTreeNode[]>(tree);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set(selectedNodeId != null ? [selectedNodeId] : []));
  const [lastSelectedId, setLastSelectedId] = React.useState<number | null>(selectedNodeId);
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false);
  const [moveTargetId, setMoveTargetId] = React.useState<number | null>(null);
  const draggingIdsRef = React.useRef<number[]>([]);
  const sidebarRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => setLocalTree(tree), [tree]);
  React.useEffect(() => {
    if (selectedNodeId == null) return;
    setSelectedIds(new Set([selectedNodeId]));
    setLastSelectedId(selectedNodeId);
  }, [selectedNodeId]);

  React.useEffect(() => {
    if (tree.length === 0) return;
    const openIds = new Set<number>();
    const walk = (node: ExplorerTreeNode) => {
      if (node.nodeType === 'folder') openIds.add(node.id);
      node.children.forEach(walk);
    };
    walk(tree[0]);
    setExpandedSet(openIds);
  }, [tree]);

  React.useEffect(() => {
    if (!sidebarRef.current || !topicPanelExpanded) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (!width) return;
      setSidebarPx(Math.round(width));
    });
    observer.observe(sidebarRef.current);
    return () => observer.disconnect();
  }, [setSidebarPx, topicPanelExpanded]);

  const searchText = search.trim().toLowerCase();
  const filteredTree = React.useMemo(() => {
    if (!searchText) return localTree;
    const filterNode = (node: ExplorerTreeNode): ExplorerTreeNode | null => {
      const children = node.children.map(filterNode).filter(Boolean) as ExplorerTreeNode[];
      const matched = node.name.toLowerCase().includes(searchText);
      if (!matched && children.length === 0) return null;
      return { ...node, children };
    };
    return localTree.map(filterNode).filter(Boolean) as ExplorerTreeNode[];
  }, [localTree, searchText]);

  const treeMap = React.useMemo(() => buildNodeMap(localTree), [localTree]);
  const selectedIdArray = React.useMemo(() => [...selectedIds], [selectedIds]);

  const folderOptions = React.useMemo(() => {
    const options: Array<{ id: number; label: string }> = [];
    const selectedSet = new Set(selectedIdArray);
    const walk = (nodes: ExplorerTreeNode[], prefix: string) => {
      for (const item of nodes) {
        if (item.nodeType === 'folder' && !selectedSet.has(item.id)) {
          const label = prefix ? `${prefix} / ${item.name}` : item.name;
          options.push({ id: item.id, label });
          walk(item.children, label);
        } else {
          walk(item.children, prefix ? `${prefix} / ${item.name}` : item.name);
        }
      }
    };
    walk(localTree, '');
    return options;
  }, [localTree, selectedIdArray]);

  React.useEffect(() => {
    if (folderOptions.length === 0) {
      setMoveTargetId(null);
      return;
    }
    setMoveTargetId((prev) => (prev != null && folderOptions.some((item) => item.id === prev) ? prev : folderOptions[0].id));
  }, [folderOptions]);

  const syncAfterMutation = () => {
    refreshExplorer();
  };

  const openMoveDialog = (nodeId: number) => {
    if (!selectedIds.has(nodeId)) {
      setSelectedIds(new Set([nodeId]));
      setLastSelectedId(nodeId);
      navigateNode(nodeId);
    }
    setMoveDialogOpen(true);
  };

  const handleBatchMoveFromDialog = async () => {
    if (moveTargetId == null) return showToast('请选择目标目录', 'warning');
    const ids = selectedIdArray;
    if (ids.length === 0) return;
    const optimistic = moveNodesToFolder(localTree, ids, moveTargetId);
    if (!optimistic) return showToast('无法移动到该目录', 'error');
    const snapshot = localTree;
    setLocalTree(optimistic.tree);
    const result = await moveExplorerNodes({
      nodeIds: ids,
      targetParentId: moveTargetId,
      targetIndex: optimistic.targetIndex,
    });
    if (!result.success) {
      setLocalTree(snapshot);
      return showToast(result.error, 'error');
    }
    showToast(`已移动 ${ids.length} 个项目`, 'success');
    setMoveDialogOpen(false);
    syncAfterMutation();
  };

  const onSelect = (nodeId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const clicked = treeMap.get(nodeId);
    if (!clicked) return;
    if (event.shiftKey && lastSelectedId != null) {
      const anchor = treeMap.get(lastSelectedId);
      if (!anchor || anchor.parentId !== clicked.parentId) {
        setSelectedIds(new Set([nodeId]));
        setLastSelectedId(nodeId);
        navigateNode(nodeId);
        return;
      }
      const siblings = (anchor.parentId == null ? localTree : treeMap.get(anchor.parentId)?.children ?? []).map((item) => item.id);
      const start = siblings.indexOf(lastSelectedId);
      const end = siblings.indexOf(nodeId);
      if (start === -1 || end === -1) {
        setSelectedIds(new Set([nodeId]));
      } else {
        const [min, max] = start < end ? [start, end] : [end, start];
        setSelectedIds(new Set(siblings.slice(min, max + 1)));
      }
      navigateNode(nodeId);
      return;
    }
    if (event.metaKey) {
      const next = new Set(selectedIds);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      setSelectedIds(next.size === 0 ? new Set([nodeId]) : next);
      setLastSelectedId(nodeId);
      navigateNode(nodeId);
      return;
    }
    setSelectedIds(new Set([nodeId]));
    setLastSelectedId(nodeId);
    navigateNode(nodeId);
  };

  const onContextSelect = (nodeId: number) => {
    if (!selectedIds.has(nodeId)) {
      setSelectedIds(new Set([nodeId]));
      setLastSelectedId(nodeId);
      navigateNode(nodeId);
    }
  };

  const handleUploadFiles = async (parentId: number, files: FileList) => {
    const list = Array.from(files);
    for (const file of list) {
      const fd = new FormData();
      fd.set('parentId', String(parentId));
      fd.set('title', file.name);
      fd.set('file', file);
      const response = await fetch('/api/admin/explorer/upload', { method: 'POST', body: fd });
      const result = (await response.json()) as { success: boolean; error?: string; data?: { id: number } };
      if (!result.success) {
        showToast(result.error ?? '上传失败', 'error');
        continue;
      }
      showToast(`已上传 ${file.name}`, 'success');
      if (result.data?.id) navigateNode(result.data.id);
    }
    syncAfterMutation();
  };

  const handleUploadPhoto: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    const parentId = uploadParentId;
    event.target.value = '';
    if (!file || parentId == null) return;
    const dataTransfer = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
      [Symbol.iterator]: function* iterator() {
        yield file;
      },
    } as unknown as FileList;
    await handleUploadFiles(parentId, dataTransfer);
  };

  const createRootFolder = async () => {
    const rootResult = await getRootNodeId();
    if (!rootResult.success) return showToast(rootResult.error, 'error');
    const name = window.prompt('新建文件夹', '新建文件夹')?.trim();
    if (!name) return;
    const result = await createFolder(rootResult.data, name);
    if (!result.success) return showToast(result.error, 'error');
    showToast('已创建文件夹', 'success');
    syncAfterMutation();
    navigateNode(result.data.id);
  };

  const handleNodeDragStart = (nodeId: number, event: React.DragEvent<HTMLDivElement>) => {
    const dragIds = selectedIds.has(nodeId) ? [...selectedIds] : [nodeId];
    draggingIdsRef.current = dragIds;
    event.dataTransfer.setData('application/x-neo-node-ids', dragIds.join(','));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeDragOver = (_nodeId: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleNodeDrop = async (nodeId: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const target = treeMap.get(nodeId);
    if (!target) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const targetFolderId = target.nodeType === 'folder' ? target.id : target.parentId;
      if (targetFolderId == null) return showToast('无效上传目标', 'error');
      await handleUploadFiles(targetFolderId, files);
      return;
    }
    const draggingIds = draggingIdsRef.current;
    if (draggingIds.length === 0) return;
    const draggingParent = treeMap.get(draggingIds[0])?.parentId ?? null;
    const sameParent = draggingIds.every((id) => treeMap.get(id)?.parentId === draggingParent);
    if (!sameParent) return showToast('多选拖拽仅支持同一父目录', 'warning');
    const snapshot = localTree;
    if (target.nodeType === 'folder') {
      const moved = moveNodesToFolder(localTree, draggingIds, target.id);
      if (!moved) return;
      setLocalTree(moved.tree);
      const result = await moveExplorerNodes({ nodeIds: draggingIds, targetParentId: target.id, targetIndex: moved.targetIndex });
      if (!result.success) {
        setLocalTree(snapshot);
        showToast(result.error, 'error');
        return;
      }
      showToast('已移动到目录', 'success');
      syncAfterMutation();
      return;
    }
    const reordered = reorderWithinParent(localTree, draggingIds, nodeId);
    if (!reordered) return;
    setLocalTree(reordered.tree);
    if (reordered.targetParentId == null) return showToast('根节点不可调整', 'warning');
    const result = await moveExplorerNodes({
      nodeIds: draggingIds,
      targetParentId: reordered.targetParentId,
      targetIndex: reordered.targetIndex,
    });
    if (!result.success) {
      setLocalTree(snapshot);
      showToast(result.error, 'error');
      return;
    }
    showToast('已更新顺序', 'success');
    syncAfterMutation();
  };

  return (
    <div
      ref={sidebarRef}
      role="presentation"
      className={cn('flex min-h-0 shrink-0 flex-col self-stretch transition-[width] duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none', topicPanelExpanded ? 'resize-x overflow-auto' : '')}
      style={{
        width: topicPanelExpanded ? sidebarPx : TOPIC_RAIL_PX,
        minWidth: topicPanelExpanded ? MIN_SIDEBAR_PX : TOPIC_RAIL_PX,
        maxWidth: topicPanelExpanded ? MAX_SIDEBAR_PX : TOPIC_RAIL_PX,
      }}
    >
      <aside className="home-topic-glass-host flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" aria-label="资源树">
        <div className="home-topic-glass-content flex min-h-0 flex-1 flex-col">
          <TopicPanelHeader
            expanded={topicPanelExpanded}
            isAdminLoggedIn={isAdminLoggedIn}
            onCollapse={() => setTopicPanelExpanded(false)}
            onExpand={() => setTopicPanelExpanded(true)}
            onCreateTopic={() => void createRootFolder()}
            onRefresh={refreshExplorer}
          />
          <div className={cn('grid min-h-0 flex-1 transition-[grid-template-rows] duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none', topicPanelExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <nav
                className="h-full min-h-0 overflow-x-hidden overflow-y-auto p-1.5"
                aria-hidden={!topicPanelExpanded}
                onContextMenu={(event) => event.preventDefault()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={async (event) => {
                  event.preventDefault();
                  if (event.dataTransfer.files.length === 0) return;
                  const rootId = tree[0]?.id;
                  if (!rootId) return;
                  await handleUploadFiles(rootId, event.dataTransfer.files);
                }}
              >
                <input ref={uploadInputRef} type="file" className="hidden" accept="image/*,.md,text/markdown" onChange={handleUploadPhoto} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索文件或目录" className="mb-2 h-8" />
                <div className="space-y-0.5">
                  {filteredTree.map((node) => (
                    <TreeItem
                      key={node.id}
                      node={node}
                      depth={0}
                      selectedIds={selectedIds}
                      lastSelectedId={lastSelectedId}
                      treeMap={treeMap}
                      expandedSet={expandedSet}
                      setExpandedSet={setExpandedSet}
                      onSelect={onSelect}
                      onContextSelect={onContextSelect}
                      onAfterChange={setLocalTree}
                      onSync={syncAfterMutation}
                      localTree={localTree}
                      showToast={showToast}
                      uploadInputRef={uploadInputRef}
                      setUploadParentId={setUploadParentId}
                      onNodeDragStart={handleNodeDragStart}
                      onNodeDragOver={handleNodeDragOver}
                      onNodeDrop={handleNodeDrop}
                      onOpenMoveDialog={openMoveDialog}
                    />
                  ))}
                </div>
              </nav>
            </div>
          </div>
        </div>
      </aside>
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量移动到目录</DialogTitle>
            <DialogDescription>已选中 {selectedIdArray.length} 个项目，选择目标目录后确认移动。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">目标目录</div>
            <select
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
              value={moveTargetId ?? ''}
              onChange={(event) => setMoveTargetId(Number(event.target.value))}
            >
              {folderOptions.length === 0 ? <option value="">无可用目录</option> : null}
              {folderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handleBatchMoveFromDialog()} disabled={folderOptions.length === 0 || moveTargetId == null}>
              确认移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

