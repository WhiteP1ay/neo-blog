'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HomeExplorerPostDndList, HomeExplorerTopicDndGroup } from '@/components/Home/HomeExplorerSortables';
import type { HomeExplorerCategoryPayload, HomeExplorerPostDetailPayload } from '@/components/Home/home-explorer-types';
import { FilePlus, MoreHorizontal, PanelLeftClose, PanelRight, Plus, Settings, Upload } from 'lucide-react';
import { PostHeader } from '@/app/(site)/blog/[id]/components/PostHeader';
import { CodeBlockCopyButtons } from '@/components/CodeBlockCopyButtons';
import { HomePostRichEditor } from '@/components/Home/HomePostRichEditor';
import { HomeWindowSettings } from '@/components/Home/HomeWindowSettings';
import { PostPageClient } from '@/app/(site)/blog/[id]/components/PostPageClient';
import { useToast } from '@/components/Toast';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePageModal } from '@/components/SitePageModals';
import { createPost, deletePost, updatePost, uploadMarkdownFromForm } from '@/server/actions/posts';
import { addPostToTopic, createTopic, deleteTopic, movePostToTopicTarget, updateTopic } from '@/server/actions/topics';
import { SITE_SHEET_QUERY_KEY, isSiteSheetModalId } from '@/app/nav';
import { formatDateShort } from '@/app/utils/date';
import { cn } from '@/lib/utils';

export type { HomeExplorerCategoryPayload, HomeExplorerPostDetailPayload } from '@/components/Home/home-explorer-types';

function topicToQueryValue(topicKey: 'uncategorized' | number): string {
  return topicKey === 'uncategorized' ? 'uncategorized' : String(topicKey);
}

function parseTopicQueryValue(v: string): 'uncategorized' | number {
  if (v === 'uncategorized') return 'uncategorized';
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 'uncategorized' : n;
}

const STORAGE_KEY = 'neo-blog-home-explorer-layout';
const LEGACY_COLUMN_KEY = 'neo-blog-home-explorer-column-widths';

const DEFAULT_SIDEBAR_PX = 216;
const DEFAULT_LIST_PX = 288;
const MIN_SIDEBAR_PX = 140;
const MAX_SIDEBAR_PX = 400;
const MIN_LIST_PX = 200;
const MAX_LIST_PX = 560;

/** 低于此宽度隐藏左侧分类栏，用下拉切换专题 */
const HIDE_SIDEBAR_BELOW_W = 760;

/** 专题栏收起后仅保留的窄轨宽度（分栏按钮） */
const TOPIC_RAIL_PX = 48;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type ResizeColumn = 'sidebar' | 'list';

/**
 * 竖向分隔条：拖拽调整左邻列宽度（macOS 备忘录式）
 */
function ColumnResizeHandle({ label, onResizeStart }: { label: string; onResizeStart: (clientX: number) => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'group relative w-3 shrink-0 cursor-col-resize border-0 bg-transparent p-0',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        onResizeStart(e.clientX);
      }}
    >
      <span
        className={cn(
          'bg-border group-hover:bg-primary/35 absolute inset-y-0 left-1/2 w-px -translate-x-1/2',
          'group-active:bg-primary/50',
        )}
        aria-hidden
      />
    </button>
  );
}

interface HomeExplorerProps {
  categories: HomeExplorerCategoryPayload[];
  activeTopicQuery: string;
  activePostId: number | null;
  postDetail: HomeExplorerPostDetailPayload | null;
  /** 已登录管理端 session 时在窗口内提供专题/文章 CRUD */
  isAdminLoggedIn: boolean;
}

/**
 * 首页桌面端：三栏布局 + URL 与 router.replace 同步（占满浏览器内容区，无独立「应用窗口」外框）
 */
export function HomeExplorer({
  categories,
  activeTopicQuery,
  activePostId,
  postDetail,
  isAdminLoggedIn,
}: HomeExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useSitePageModal();
  const { showToast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [renameTopicState, setRenameTopicState] = useState<{ id: number; name: string } | null>(null);
  const [deleteTopicId, setDeleteTopicId] = useState<number | null>(null);
  const [renamePostState, setRenamePostState] = useState<{ id: number; title: string } | null>(null);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [listDropActive, setListDropActive] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  /** 当前内容区宽度，用于窄屏时收起左侧专题栏 */
  const [containerWidth, setContainerWidth] = useState(1200);

  const [sidebarPx, setSidebarPx] = useState(DEFAULT_SIDEBAR_PX);
  const [listPx, setListPx] = useState(DEFAULT_LIST_PX);
  /** 宽屏下专题毛玻璃面板展开/收起（与拖拽宽度独立记忆） */
  const [topicPanelExpanded, setTopicPanelExpanded] = useState(true);
  const [activeResize, setActiveResize] = useState<ResizeColumn | null>(null);
  const resizeStartRef = useRef({ x: 0, sidebar: DEFAULT_SIDEBAR_PX, list: DEFAULT_LIST_PX });
  const skipSaveRef = useRef(true);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      setContainerWidth(Math.max(0, Math.floor(el.getBoundingClientRect().width)));
    });
    ro.observe(el);
    setContainerWidth(Math.max(0, Math.floor(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const p = JSON.parse(raw) as { sidebar?: unknown; list?: unknown; topicExpanded?: unknown };
        if (typeof p.sidebar === 'number') {
          setSidebarPx(clamp(p.sidebar, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX));
        }
        if (typeof p.list === 'number') {
          setListPx(clamp(p.list, MIN_LIST_PX, MAX_LIST_PX));
        }
        if (typeof p.topicExpanded === 'boolean') {
          setTopicPanelExpanded(p.topicExpanded);
        }
      } catch {
        /* 忽略 */
      }
    } else {
      try {
        const legacy = localStorage.getItem(LEGACY_COLUMN_KEY);
        if (legacy) {
          const p = JSON.parse(legacy) as { sidebar?: unknown; list?: unknown };
          if (typeof p.sidebar === 'number') {
            setSidebarPx(clamp(p.sidebar, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX));
          }
          if (typeof p.list === 'number') {
            setListPx(clamp(p.list, MIN_LIST_PX, MAX_LIST_PX));
          }
        }
      } catch {
        /* 忽略 */
      }
    }
    skipSaveRef.current = false;
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) {
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sidebar: sidebarPx,
          list: listPx,
          topicExpanded: topicPanelExpanded,
        }),
      );
    } catch {
      /* 忽略 */
    }
  }, [sidebarPx, listPx, topicPanelExpanded]);

  useEffect(() => {
    if (!activeResize) {
      return;
    }
    const which = activeResize;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartRef.current.x;
      if (which === 'sidebar') {
        setSidebarPx(clamp(resizeStartRef.current.sidebar + dx, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX));
      } else {
        setListPx(clamp(resizeStartRef.current.list + dx, MIN_LIST_PX, MAX_LIST_PX));
      }
    };
    const onUp = () => setActiveResize(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
  }, [activeResize]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  useEffect(() => {
    void activePostId;
    setEditingPost(false);
  }, [activePostId]);

  const refreshExplorer = useCallback(() => {
    router.refresh();
  }, [router]);

  const clearPostFromUrl = useCallback(() => {
    const p = new URLSearchParams();
    p.set('topic', activeTopicQuery);
    const sheet = searchParams.get(SITE_SHEET_QUERY_KEY);
    if (sheet != null && isSiteSheetModalId(sheet)) {
      p.set(SITE_SHEET_QUERY_KEY, sheet);
    }
    router.replace(`/?${p.toString()}`);
  }, [activeTopicQuery, router, searchParams]);

  const appendSheetToHomeQuery = useCallback(
    (p: URLSearchParams) => {
      const sheet = searchParams.get(SITE_SHEET_QUERY_KEY);
      if (sheet != null && isSiteSheetModalId(sheet)) {
        p.set(SITE_SHEET_QUERY_KEY, sheet);
      }
    },
    [searchParams],
  );

  const navigateTopic = useCallback(
    (topicKey: 'uncategorized' | number) => {
      const t = topicToQueryValue(topicKey);
      const p = new URLSearchParams();
      p.set('topic', t);
      appendSheetToHomeQuery(p);
      router.replace(`/?${p.toString()}`);
    },
    [appendSheetToHomeQuery, router],
  );

  const navigatePost = useCallback(
    (topicKey: 'uncategorized' | number, postId: number) => {
      const t = topicToQueryValue(topicKey);
      const p = new URLSearchParams();
      p.set('topic', t);
      p.set('post', String(postId));
      appendSheetToHomeQuery(p);
      router.replace(`/?${p.toString()}`);
    },
    [appendSheetToHomeQuery, router],
  );

  const beginResizeSidebar = useCallback(
    (clientX: number) => {
      resizeStartRef.current = { x: clientX, sidebar: sidebarPx, list: listPx };
      setActiveResize('sidebar');
    },
    [sidebarPx, listPx],
  );

  const beginResizeList = useCallback(
    (clientX: number) => {
      resizeStartRef.current = { x: clientX, sidebar: sidebarPx, list: listPx };
      setActiveResize('list');
    },
    [sidebarPx, listPx],
  );

  const showSidebar = containerWidth >= HIDE_SIDEBAR_BELOW_W;

  const activeCategory = categories.find((c) => topicToQueryValue(c.topicKey) === activeTopicQuery) ?? categories[0];
  const posts = activeCategory?.posts ?? [];

  const handleCreatePost = useCallback(async () => {
    if (!isAdminLoggedIn) {
      return;
    }
    const r = await createPost({ title: '无标题', content: '<p></p>' });
    if (!r.success || !r.data) {
      showToast(r.error ?? '创建失败', 'error');
      return;
    }
    const id = r.data.id;
    const tk = activeCategory.topicKey;
    if (tk !== 'uncategorized') {
      const add = await addPostToTopic(tk, id);
      if (!add.success) {
        showToast(add.error ?? '加入专题失败', 'warning');
      }
    }
    refreshExplorer();
    navigatePost(tk, id);
    setEditingPost(true);
  }, [activeCategory.topicKey, isAdminLoggedIn, navigatePost, refreshExplorer, showToast]);

  const uploadMarkdownFile = useCallback(
    async (file: File) => {
      if (!isAdminLoggedIn) {
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      let result: Awaited<ReturnType<typeof uploadMarkdownFromForm>>;
      try {
        result = await uploadMarkdownFromForm(formData);
      } catch {
        showToast('上传失败', 'error');
        return;
      }
      if (!result.success || result.data?.id == null) {
        showToast(result.error ?? '上传失败', 'error');
        return;
      }
      const id = result.data.id;
      const tk = activeCategory.topicKey;
      if (tk !== 'uncategorized') {
        const add = await addPostToTopic(tk, id);
        if (!add.success) {
          showToast(add.error ?? '加入专题失败', 'warning');
        }
      }
      showToast('上传成功', 'success');
      refreshExplorer();
      navigatePost(tk, id);
      setEditingPost(false);
    },
    [activeCategory.topicKey, isAdminLoggedIn, navigatePost, refreshExplorer, showToast],
  );

  const handleUploadMarkdownInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) {
        return;
      }
      if (!file.name.toLowerCase().endsWith('.md')) {
        showToast('请选择 .md 文件', 'warning');
        return;
      }
      void uploadMarkdownFile(file);
    },
    [showToast, uploadMarkdownFile],
  );

  const submitNewTopic = useCallback(async () => {
    const name = newTopicName.trim() || '未命名专题';
    const r = await createTopic({ name });
    if (!r.success) {
      showToast(r.error ?? '创建失败', 'error');
      return;
    }
    showToast('已创建专题', 'success');
    setNewTopicOpen(false);
    setNewTopicName('');
    refreshExplorer();
    if (r.data?.id != null) {
      navigateTopic(r.data.id);
    }
  }, [newTopicName, navigateTopic, refreshExplorer, showToast]);

  const submitRenameTopic = useCallback(async () => {
    if (!renameTopicState) {
      return;
    }
    const name = renameTopicState.name.trim();
    if (!name) {
      showToast('名称不能为空', 'error');
      return;
    }
    const r = await updateTopic(renameTopicState.id, { name });
    if (!r.success) {
      showToast(r.error ?? '重命名失败', 'error');
      return;
    }
    showToast('已更新', 'success');
    setRenameTopicState(null);
    refreshExplorer();
  }, [renameTopicState, refreshExplorer, showToast]);

  const submitDeleteTopic = useCallback(async () => {
    if (deleteTopicId == null) {
      return;
    }
    const r = await deleteTopic(deleteTopicId);
    if (!r.success) {
      showToast(r.error ?? '删除失败', 'error');
      return;
    }
    showToast('已删除专题', 'success');
    if (topicToQueryValue(deleteTopicId) === activeTopicQuery) {
      navigateTopic('uncategorized');
    }
    setDeleteTopicId(null);
    refreshExplorer();
  }, [activeTopicQuery, deleteTopicId, navigateTopic, refreshExplorer, showToast]);

  const submitRenamePost = useCallback(async () => {
    if (!renamePostState) {
      return;
    }
    const title = renamePostState.title.trim() || '无标题';
    const r = await updatePost(renamePostState.id, { title });
    if (!r.success) {
      showToast(r.error ?? '重命名失败', 'error');
      return;
    }
    showToast('已更新标题', 'success');
    setRenamePostState(null);
    refreshExplorer();
  }, [renamePostState, refreshExplorer, showToast]);

  const submitDeletePost = useCallback(async () => {
    if (deletePostId == null) {
      return;
    }
    const r = await deletePost(deletePostId);
    if (!r.success) {
      showToast(r.error ?? '删除失败', 'error');
      return;
    }
    showToast('已删除', 'success');
    if (activePostId === deletePostId) {
      clearPostFromUrl();
    }
    setDeletePostId(null);
    refreshExplorer();
  }, [activePostId, clearPostFromUrl, deletePostId, refreshExplorer, showToast]);

  const handleMovePost = useCallback(
    async (postId: number, target: 'uncategorized' | number) => {
      const r = await movePostToTopicTarget(postId, target);
      if (!r.success) {
        showToast(r.error ?? '移动失败', 'error');
        return;
      }
      showToast('已移动', 'success');
      refreshExplorer();
      navigatePost(target, postId);
    },
    [navigatePost, refreshExplorer, showToast],
  );

  const { uncategorizedCategory, pinnedTopicCategories, unpinnedTopicCategories } = useMemo(() => {
    const unc = categories[0];
    const real = categories.slice(1);
    return {
      uncategorizedCategory: unc,
      pinnedTopicCategories: real.filter((c) => c.isPinned),
      unpinnedTopicCategories: real.filter((c) => !c.isPinned),
    };
  }, [categories]);

  const handleToggleTopicPin = useCallback(
    async (cat: HomeExplorerCategoryPayload) => {
      if (cat.topicKey === 'uncategorized') {
        return;
      }
      const r = await updateTopic(cat.topicKey, { isPinned: !cat.isPinned });
      if (!r.success) {
        showToast(r.error ?? '操作失败', 'error');
        return;
      }
      showToast(cat.isPinned ? '已取消置顶' : '已置顶', 'success');
      refreshExplorer();
    },
    [refreshExplorer, showToast],
  );

  const handleTogglePostPin = useCallback(
    async (postId: number, nextPinned: boolean) => {
      const r = await updatePost(postId, { isPinned: nextPinned });
      if (!r.success) {
        showToast(r.error ?? '操作失败', 'error');
        return;
      }
      showToast(nextPinned ? '已置顶' : '已取消置顶', 'success');
      refreshExplorer();
    },
    [refreshExplorer, showToast],
  );

  const openPostEditor = useCallback(
    (topicKey: 'uncategorized' | number, postId: number) => {
      navigatePost(topicKey, postId);
      setEditingPost(true);
    },
    [navigatePost],
  );

  const renderPostContextMenuActions = useCallback(
    (post: HomeExplorerCategoryPayload['posts'][number]) => (
      <>
        <ContextMenuItem onSelect={() => openPostEditor(activeCategory.topicKey, post.id)}>编辑</ContextMenuItem>
        <ContextMenuItem onSelect={() => void handleTogglePostPin(post.id, !post.isPinned)}>
          {post.isPinned ? '取消置顶' : '置顶'}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>移动到…</ContextMenuSubTrigger>
          <ContextMenuSubContent className="max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <ContextMenuItem
                key={topicToQueryValue(cat.topicKey)}
                disabled={cat.topicKey === activeCategory.topicKey}
                onSelect={() => void handleMovePost(post.id, cat.topicKey)}
              >
                {cat.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onSelect={() => setRenamePostState({ id: post.id, title: post.title })}>
          重命名
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={() => setDeletePostId(post.id)}>
          删除
        </ContextMenuItem>
      </>
    ),
    [activeCategory.topicKey, categories, handleMovePost, handleTogglePostPin, openPostEditor],
  );

  const renderPostDropdownActions = useCallback(
    (post: HomeExplorerCategoryPayload['posts'][number]) => (
      <>
        <DropdownMenuItem onClick={() => openPostEditor(activeCategory.topicKey, post.id)}>编辑</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleTogglePostPin(post.id, !post.isPinned)}>
          {post.isPinned ? '取消置顶' : '置顶'}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>移动到…</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <DropdownMenuItem
                key={topicToQueryValue(cat.topicKey)}
                disabled={cat.topicKey === activeCategory.topicKey}
                onClick={() => void handleMovePost(post.id, cat.topicKey)}
              >
                {cat.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => setRenamePostState({ id: post.id, title: post.title })}>
          重命名
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletePostId(post.id)}>
          删除
        </DropdownMenuItem>
      </>
    ),
    [activeCategory.topicKey, categories, handleMovePost, handleTogglePostPin, openPostEditor],
  );

  const publishedTime = postDetail?.createdAt ?? undefined;

  return (
    <div ref={shellRef} className="bg-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <header className="border-border bg-muted/40 shrink-0 border-b">
        <div className="flex h-10 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <Link href="/" className="truncate text-sm font-bold text-foreground sm:text-base">
            White Meta
          </Link>
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-primary hidden text-xs font-medium transition-colors sm:inline"
          >
            博客
          </Link>
          <span className="min-w-2 flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-9 shrink-0"
            onClick={() => setSettingsOpen(true)}
            aria-label="打开设置"
            title="设置"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      <div className="bg-muted/25 flex min-h-0 flex-1 gap-2.5 p-2.5 dark:bg-muted/20">
        {showSidebar ? (
          <>
            <div
              className="flex min-h-0 shrink-0 flex-col self-stretch transition-[width] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
              style={{ width: topicPanelExpanded ? sidebarPx : TOPIC_RAIL_PX }}
            >
              <aside
                className="home-topic-glass-host flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                aria-label="分类"
              >
                <div className="home-topic-glass-backdrop" aria-hidden />
                <div className="home-topic-glass-edge" aria-hidden />
                <div className="home-topic-glass-content flex min-h-0 flex-1 flex-col">
                  <div
                    className={cn(
                      'flex shrink-0 items-center gap-1 border-b border-white/20 px-2 py-2 dark:border-white/10',
                      topicPanelExpanded ? 'justify-between' : 'justify-center',
                    )}
                  >
                    {topicPanelExpanded ? (
                      <>
                        <div className="flex min-w-0 items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                            onClick={() => setTopicPanelExpanded(false)}
                            aria-label="收起专题栏"
                            title="收起专题栏"
                          >
                            <PanelLeftClose className="size-4" />
                          </Button>
                          <span className="text-muted-foreground truncate text-xs font-semibold uppercase tracking-wide">
                            专题
                          </span>
                        </div>
                        {isAdminLoggedIn ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            aria-label="新建专题"
                            title="新建专题"
                            onClick={() => {
                              setNewTopicName('');
                              setNewTopicOpen(true);
                            }}
                          >
                            <Plus className="size-4" />
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground size-9 shrink-0"
                        onClick={() => setTopicPanelExpanded(true)}
                        aria-label="展开专题栏"
                        title="展开专题栏"
                      >
                        <PanelRight className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div
                    className={cn(
                      'grid min-h-0 flex-1 transition-[grid-template-rows] duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
                      topicPanelExpanded ? '[grid-template-rows:1fr]' : '[grid-template-rows:0fr]',
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <nav
                        className="h-full min-h-0 overflow-x-hidden overflow-y-auto p-1.5"
                        aria-hidden={!topicPanelExpanded}
                      >
                        <ul className="flex flex-col gap-0.5">
                          {!isAdminLoggedIn
                            ? categories.map((cat) => {
                                const q = topicToQueryValue(cat.topicKey);
                                const isActive = q === activeTopicQuery;
                                return (
                                  <li key={q}>
                                    <div
                                      className={cn(
                                        'group/topic flex w-full items-center gap-0.5 rounded-md',
                                        isActive ? 'bg-accent/80' : 'hover:bg-accent/40',
                                      )}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => navigateTopic(cat.topicKey)}
                                        className={cn(
                                          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                                          isActive ? 'text-accent-foreground font-medium' : 'text-foreground/90',
                                        )}
                                        aria-current={isActive ? 'true' : undefined}
                                      >
                                        <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                                        {cat.isPinned ? (
                                          <Badge
                                            variant="outline"
                                            className="shrink-0 border-amber-500/40 px-1 py-0 text-[10px] text-amber-800 dark:text-amber-200"
                                          >
                                            置顶
                                          </Badge>
                                        ) : null}
                                      </button>
                                    </div>
                                  </li>
                                );
                              })
                            : null}
                          {isAdminLoggedIn && uncategorizedCategory ? (
                            <li key="uncategorized">
                              <div
                                className={cn(
                                  'group/topic flex w-full items-center gap-0.5 rounded-md',
                                  topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery
                                    ? 'bg-accent/80'
                                    : 'hover:bg-accent/40',
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => navigateTopic(uncategorizedCategory.topicKey)}
                                  className={cn(
                                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                                    topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery
                                      ? 'text-accent-foreground font-medium'
                                      : 'text-foreground/90',
                                  )}
                                  aria-current={
                                    topicToQueryValue(uncategorizedCategory.topicKey) === activeTopicQuery
                                      ? 'true'
                                      : undefined
                                  }
                                >
                                  <span className="min-w-0 flex-1 truncate">{uncategorizedCategory.name}</span>
                                </button>
                              </div>
                            </li>
                          ) : null}
                          {isAdminLoggedIn ? (
                            <>
                              <HomeExplorerTopicDndGroup
                                dndContextId="home-explorer-topics-pinned"
                                topics={pinnedTopicCategories}
                                activeTopicQuery={activeTopicQuery}
                                onOrderSaved={refreshExplorer}
                                showToast={showToast}
                                renderTopicRow={({ cat, isActive, dragHandle }) => (
                                  <div
                                    className={cn(
                                      'group/topic flex w-full items-center gap-0.5 rounded-md',
                                      isActive ? 'bg-accent/80' : 'hover:bg-accent/40',
                                    )}
                                  >
                                    {dragHandle}
                                    <button
                                      type="button"
                                      onClick={() => navigateTopic(cat.topicKey)}
                                      className={cn(
                                        'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                                        isActive ? 'text-accent-foreground font-medium' : 'text-foreground/90',
                                      )}
                                      aria-current={isActive ? 'true' : undefined}
                                    >
                                      <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                                      {cat.isPinned ? (
                                        <Badge
                                          variant="outline"
                                          className="shrink-0 border-amber-500/40 px-1 py-0 text-[10px] text-amber-800 dark:text-amber-200"
                                        >
                                          置顶
                                        </Badge>
                                      ) : null}
                                    </button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground hover:text-foreground size-8 shrink-0 opacity-0 transition-opacity group-hover/topic:opacity-100"
                                          aria-label={`「${cat.name}」更多`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => void handleToggleTopicPin(cat)}>
                                          {cat.isPinned ? '取消置顶' : '置顶'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setRenameTopicState({ id: cat.topicKey as number, name: cat.name })
                                          }
                                        >
                                          重命名
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setDeleteTopicId(cat.topicKey as number)}
                                        >
                                          删除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              />
                              <HomeExplorerTopicDndGroup
                                dndContextId="home-explorer-topics-unpinned"
                                topics={unpinnedTopicCategories}
                                activeTopicQuery={activeTopicQuery}
                                onOrderSaved={refreshExplorer}
                                showToast={showToast}
                                renderTopicRow={({ cat, isActive, dragHandle }) => (
                                  <div
                                    className={cn(
                                      'group/topic flex w-full items-center gap-0.5 rounded-md',
                                      isActive ? 'bg-accent/80' : 'hover:bg-accent/40',
                                    )}
                                  >
                                    {dragHandle}
                                    <button
                                      type="button"
                                      onClick={() => navigateTopic(cat.topicKey)}
                                      className={cn(
                                        'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                                        isActive ? 'text-accent-foreground font-medium' : 'text-foreground/90',
                                      )}
                                      aria-current={isActive ? 'true' : undefined}
                                    >
                                      <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                                      {cat.isPinned ? (
                                        <Badge
                                          variant="outline"
                                          className="shrink-0 border-amber-500/40 px-1 py-0 text-[10px] text-amber-800 dark:text-amber-200"
                                        >
                                          置顶
                                        </Badge>
                                      ) : null}
                                    </button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground hover:text-foreground size-8 shrink-0 opacity-0 transition-opacity group-hover/topic:opacity-100"
                                          aria-label={`「${cat.name}」更多`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => void handleToggleTopicPin(cat)}>
                                          {cat.isPinned ? '取消置顶' : '置顶'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setRenameTopicState({ id: cat.topicKey as number, name: cat.name })
                                          }
                                        >
                                          重命名
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setDeleteTopicId(cat.topicKey as number)}
                                        >
                                          删除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              />
                            </>
                          ) : null}
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
            {topicPanelExpanded ? (
              <ColumnResizeHandle label="拖拽调整专题栏宽度" onResizeStart={beginResizeSidebar} />
            ) : null}
          </>
        ) : null}

        <section
          className="relative flex min-w-0 shrink-0 flex-col bg-muted/15"
          style={{ width: listPx }}
          aria-label="文章列表"
          onDragEnter={(e) => {
            if (!isAdminLoggedIn) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            if (![...e.dataTransfer.types].includes('Files')) {
              return;
            }
            setListDropActive(true);
          }}
          onDragLeave={(e) => {
            if (!isAdminLoggedIn) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            const next = e.relatedTarget as Node | null;
            if (next && e.currentTarget.contains(next)) {
              return;
            }
            setListDropActive(false);
          }}
          onDragOver={(e) => {
            if (!isAdminLoggedIn) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            if (!isAdminLoggedIn) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            setListDropActive(false);
            const file = e.dataTransfer.files[0];
            if (!file) {
              return;
            }
            if (!file.name.toLowerCase().endsWith('.md')) {
              showToast('请拖拽 .md 文件', 'warning');
              return;
            }
            void uploadMarkdownFile(file);
          }}
        >
          {isAdminLoggedIn && listDropActive ? (
            <div
              className="pointer-events-none absolute inset-1 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10"
              aria-hidden
            >
              <span className="text-primary px-2 text-center text-sm font-medium">释放以上传 Markdown</span>
            </div>
          ) : null}
          <div className="border-border flex flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {!showSidebar ? (
                <label className="text-muted-foreground flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide">
                  <span className="sr-only">选择专题</span>
                  <span className="text-[10px] opacity-80">专题</span>
                  <select
                    value={activeTopicQuery}
                    onChange={(e) => navigateTopic(parseTopicQueryValue(e.target.value))}
                    className="border-input bg-background text-foreground max-w-full rounded-md border px-2 py-1.5 text-sm font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={topicToQueryValue(cat.topicKey)} value={topicToQueryValue(cat.topicKey)}>
                        {cat.name}
                        {cat.isPinned ? '（置顶）' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  {activeCategory?.name ?? '文章'}
                </span>
              )}
            </div>
            {isAdminLoggedIn ? (
              <div className="flex shrink-0 items-center gap-1">
                <input
                  ref={uploadFileInputRef}
                  type="file"
                  accept=".md,text/markdown"
                  className="hidden"
                  aria-hidden
                  onChange={handleUploadMarkdownInput}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="新建文章"
                  title="新建文章"
                  onClick={() => void handleCreatePost()}
                >
                  <FilePlus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="上传 Markdown 文章"
                  title="上传 Markdown（可拖入本栏）"
                  onClick={() => uploadFileInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {posts.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">此分类下暂无文章</p>
            ) : isAdminLoggedIn && activeCategory.topicKey !== 'uncategorized' ? (
              <div
                role="listbox"
                aria-label={`${activeCategory?.name ?? '文章'}下的条目`}
                className="flex flex-col gap-0.5"
              >
                <HomeExplorerPostDndList
                  topicId={activeCategory.topicKey}
                  posts={posts}
                  activePostId={activePostId}
                  onOrderSaved={refreshExplorer}
                  showToast={showToast}
                  renderPostRow={({ post, selected, dragHandle }) => {
                    const rowBody = (
                      <>
                        <span className="line-clamp-2 leading-snug">{post.title}</span>
                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                          {post.createdAt ? (
                            <time dateTime={post.createdAt}>{formatDateShort(post.createdAt)}</time>
                          ) : null}
                          {post.isPinned ? (
                            <Badge variant="outline" className="h-5 border-amber-500/40 px-1 text-[10px]">
                              置顶
                            </Badge>
                          ) : null}
                        </span>
                      </>
                    );
                    return (
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <div
                            className={cn(
                              'group/post flex w-full items-stretch gap-0.5 rounded-md transition-colors',
                              selected
                                ? 'bg-primary/15 text-foreground ring-1 ring-primary/20'
                                : 'hover:bg-accent/50 text-foreground/90',
                            )}
                          >
                            {dragHandle}
                            <button
                              type="button"
                              role="option"
                              className="flex min-w-0 flex-1 flex-col gap-1 rounded-md px-2 py-2.5 text-left text-sm"
                              onClick={() => navigatePost(activeCategory.topicKey, post.id)}
                              aria-selected={selected}
                            >
                              {rowBody}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground size-8 shrink-0 self-center opacity-0 transition-opacity group-hover/post:opacity-100"
                                  aria-label={`「${post.title}」更多`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                {renderPostDropdownActions(post)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">{renderPostContextMenuActions(post)}</ContextMenuContent>
                      </ContextMenu>
                    );
                  }}
                />
              </div>
            ) : (
              <div
                className="flex flex-col gap-0.5"
                role="listbox"
                aria-label={`${activeCategory?.name ?? '文章'}下的条目`}
              >
                {posts.map((post) => {
                  const selected = activePostId === post.id;
                  const rowToneClass = cn(
                    selected
                      ? 'bg-primary/15 text-foreground font-medium ring-1 ring-primary/20'
                      : 'hover:bg-accent/50 text-foreground/90',
                  );
                  const rowClass = cn(
                    'flex w-full flex-col gap-1 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors',
                    rowToneClass,
                  );
                  const rowBody = (
                    <>
                      <span className="line-clamp-2 leading-snug">{post.title}</span>
                      <span className="text-muted-foreground flex items-center gap-2 text-xs">
                        {post.createdAt ? (
                          <time dateTime={post.createdAt}>{formatDateShort(post.createdAt)}</time>
                        ) : null}
                        {post.isPinned ? (
                          <Badge variant="outline" className="h-5 border-amber-500/40 px-1 text-[10px]">
                            置顶
                          </Badge>
                        ) : null}
                      </span>
                    </>
                  );
                  if (!isAdminLoggedIn) {
                    return (
                      <button
                        key={post.id}
                        type="button"
                        role="option"
                        onClick={() => navigatePost(activeCategory.topicKey, post.id)}
                        className={rowClass}
                        aria-selected={selected}
                      >
                        {rowBody}
                      </button>
                    );
                  }
                  return (
                    <ContextMenu key={post.id}>
                      <ContextMenuTrigger asChild>
                        <div className={cn('group/post flex items-stretch gap-0.5 rounded-md', rowToneClass)}>
                          <button
                            type="button"
                            role="option"
                            onClick={() => navigatePost(activeCategory.topicKey, post.id)}
                            className="flex min-w-0 flex-1 flex-col gap-1 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors"
                            aria-selected={selected}
                          >
                            {rowBody}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground size-8 shrink-0 self-center opacity-0 transition-opacity group-hover/post:opacity-100"
                                aria-label={`「${post.title}」更多`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {renderPostDropdownActions(post)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-52">{renderPostContextMenuActions(post)}</ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <ColumnResizeHandle label="拖拽调整文章列表宽度" onResizeStart={beginResizeList} />

        <section className="min-w-0 flex-1 overflow-y-auto bg-background" aria-label="文章正文">
          {!postDetail ? (
            <div className="text-muted-foreground flex h-full min-h-48 items-center justify-center p-8 text-center text-sm">
              选择左侧列表中的一篇文章以阅读全文
            </div>
          ) : isAdminLoggedIn && editingPost ? (
            <HomePostRichEditor
              key={postDetail.id}
              post={{
                id: postDetail.id,
                title: postDetail.title,
                content: postDetail.contentSource,
                createdAt: postDetail.createdAt,
                updatedAt: postDetail.updatedAt,
              }}
              onSaved={() => {
                setEditingPost(false);
                refreshExplorer();
              }}
              onCancel={() => setEditingPost(false)}
            />
          ) : (
            <div key={postDetail.id} className="p-4 sm:p-8">
              <article className="mx-auto max-w-3xl">
                <PostHeader
                  title={postDetail.title}
                  createdAt={postDetail.createdAt ? new Date(postDetail.createdAt) : null}
                  publishedTime={publishedTime}
                />
                <div
                  className="prose prose-neutral dark:prose-invert prose-sm sm:prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: postDetail.content }}
                />
              </article>
              <CodeBlockCopyButtons contentKey={`${postDetail.id}-${postDetail.contentSource.length}`} />
              <div className="mx-auto mt-8 max-w-3xl border-t border-border pt-6">
                <PostPageClient postId={postDetail.id} />
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="border-border bg-muted/30 shrink-0 border-t">
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-2 text-xs sm:flex-row sm:flex-wrap sm:gap-x-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => openModal('tools')}
              className="hover:text-primary font-medium transition-colors"
            >
              工具
            </button>
            <span className="select-none opacity-30" aria-hidden>
              ·
            </span>
            <Link href="/blog" className="hover:text-primary font-medium transition-colors">
              博客
            </Link>
          </div>
          <span className="text-center opacity-80 sm:text-left">© 2026 White Meta. 保留所有权利。</span>
        </div>
      </footer>

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
                  onChange={(e) => setRenameTopicState((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
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
            <AlertDialogDescription>
              专题与文章的关联会解除，文章不会删除，将出现在「未分类」中。
            </AlertDialogDescription>
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
                  onChange={(e) => setRenamePostState((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
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

      {settingsOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="关闭设置"
            onClick={() => setSettingsOpen(false)}
          />
          <div
            className="border-border bg-card relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-xl border shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-settings-title"
          >
            <HomeWindowSettings onClose={() => setSettingsOpen(false)} isAdminLoggedIn={isAdminLoggedIn} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
