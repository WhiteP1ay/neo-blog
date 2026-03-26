/**
 * Home Explorer 布局 store（zustand + persist）。
 *
 * 设计要点：
 * - 将“可持久化的布局数据”和“临时 UI 状态”分开（通过 partialize）
 * - 所有写入都会做边界 clamp，避免异常值污染持久化数据
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_LIST_PX,
  DEFAULT_SIDEBAR_PX,
  HOME_EXPLORER_LAYOUT_STORAGE_KEY,
  MAX_LIST_PX,
  MAX_SIDEBAR_PX,
  MIN_LIST_PX,
  MIN_SIDEBAR_PX,
} from '../constant/home-explorer-layout';
import { clamp } from '../utils/home-explorer';

type PersistedHomeExplorerLayoutState = {
  sidebarPx: number;
  listPx: number;
  topicPanelExpanded: boolean;
};

type HomeExplorerLayoutState = PersistedHomeExplorerLayoutState & {
  /**
   * 设置层是否打开。这个状态不持久化（避免历史残留）。
   */
  settingsOpen: boolean;

  setSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;

  setSidebarPx: (px: number) => void;
  setListPx: (px: number) => void;
  setTopicPanelExpanded: (expanded: boolean) => void;
};

export const useHomeExplorerLayoutStore = create<HomeExplorerLayoutState>()(
  persist(
    (set) => ({
      settingsOpen: false,

      sidebarPx: DEFAULT_SIDEBAR_PX,
      listPx: DEFAULT_LIST_PX,
      topicPanelExpanded: true,

      setSettingsOpen: (open) => set({ settingsOpen: open }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      setSidebarPx: (px) => set({ sidebarPx: clamp(px, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX) }),
      setListPx: (px) => set({ listPx: clamp(px, MIN_LIST_PX, MAX_LIST_PX) }),
      setTopicPanelExpanded: (expanded) => set({ topicPanelExpanded: expanded }),
    }),
    {
      name: HOME_EXPLORER_LAYOUT_STORAGE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s): PersistedHomeExplorerLayoutState => ({
        sidebarPx: s.sidebarPx,
        listPx: s.listPx,
        topicPanelExpanded: s.topicPanelExpanded,
      }),
    },
  ),
);

