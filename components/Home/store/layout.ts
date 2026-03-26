/**
 * 布局 store（zustand + persist）。
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
} from '../constant/layout';
import { clamp } from '../utils/explorer';

type PersistedLayoutState = {
  sidebarPx: number;
  listPx: number;
  topicPanelExpanded: boolean;
};

type LayoutState = PersistedLayoutState & {
  /** 设置层是否打开；不持久化 */
  settingsOpen: boolean;

  setSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;

  setSidebarPx: (px: number) => void;
  setListPx: (px: number) => void;
  setTopicPanelExpanded: (expanded: boolean) => void;
};

export const useLayoutStore = create<LayoutState>()(
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
      partialize: (s): PersistedLayoutState => ({
        sidebarPx: s.sidebarPx,
        listPx: s.listPx,
        topicPanelExpanded: s.topicPanelExpanded,
      }),
    },
  ),
);

