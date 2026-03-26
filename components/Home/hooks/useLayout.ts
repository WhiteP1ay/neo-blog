'use client';

/**
 * 布局交互（拖拽调整列宽、ESC 关闭设置层等）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_LIST_PX, DEFAULT_SIDEBAR_PX, MAX_LIST_PX, MAX_SIDEBAR_PX, MIN_LIST_PX, MIN_SIDEBAR_PX } from '../constant/layout';
import type { HomeExplorerResizeColumn } from '../type/layout';
import { clamp } from '../utils/explorer';
import { useLayoutStore } from '../store/layout';

export function useLayout() {
  const settingsOpen = useLayoutStore((s) => s.settingsOpen);
  const setSettingsOpen = useLayoutStore((s) => s.setSettingsOpen);

  const sidebarPx = useLayoutStore((s) => s.sidebarPx);
  const listPx = useLayoutStore((s) => s.listPx);
  const setSidebarPx = useLayoutStore((s) => s.setSidebarPx);
  const setListPx = useLayoutStore((s) => s.setListPx);

  const [activeResize, setActiveResize] = useState<HomeExplorerResizeColumn | null>(null);
  const resizeStartRef = useRef({ x: 0, sidebar: DEFAULT_SIDEBAR_PX, list: DEFAULT_LIST_PX });

  useEffect(() => {
    if (!activeResize) return;
    const which = activeResize;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartRef.current.x;
      if (which === 'sidebar') setSidebarPx(clamp(resizeStartRef.current.sidebar + dx, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX));
      else setListPx(clamp(resizeStartRef.current.list + dx, MIN_LIST_PX, MAX_LIST_PX));
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
  }, [activeResize, setListPx, setSidebarPx]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, setSettingsOpen]);

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

  return { beginResizeSidebar, beginResizeList };
}

