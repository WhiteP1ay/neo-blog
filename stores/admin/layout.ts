import { create } from 'zustand';
import {
  DEFAULT_SIDEBAR_PX,
  HOME_EXPLORER_LAYOUT_STORAGE_KEY,
  MAX_SIDEBAR_PX,
  MIN_SIDEBAR_PX,
} from '@/constants/admin/layout';
import { clamp } from '@/utils/admin/explorer';

type LayoutState = {
  sidebarPx: number;
  topicPanelExpanded: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSidebarPx: (px: number) => void;
  setTopicPanelExpanded: (expanded: boolean) => void;
};

function readInitialLayout() {
  if (typeof window === 'undefined') {
    return {
      sidebarPx: DEFAULT_SIDEBAR_PX,
      topicPanelExpanded: true,
    };
  }
  try {
    const raw = window.localStorage.getItem(HOME_EXPLORER_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {
        sidebarPx: DEFAULT_SIDEBAR_PX,
        topicPanelExpanded: true,
      };
    }
    const parsed = JSON.parse(raw) as { sidebarPx?: number; topicPanelExpanded?: boolean };
    return {
      sidebarPx: clamp(parsed.sidebarPx ?? DEFAULT_SIDEBAR_PX, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX),
      topicPanelExpanded: parsed.topicPanelExpanded ?? true,
    };
  } catch {
    return {
      sidebarPx: DEFAULT_SIDEBAR_PX,
      topicPanelExpanded: true,
    };
  }
}

function writeLayout(sidebarPx: number, topicPanelExpanded: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HOME_EXPLORER_LAYOUT_STORAGE_KEY, JSON.stringify({ sidebarPx, topicPanelExpanded }));
}

const initial = readInitialLayout();

export const useLayoutStore = create<LayoutState>((set, _get) => ({
  settingsOpen: false,
  sidebarPx: initial.sidebarPx,
  topicPanelExpanded: initial.topicPanelExpanded,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSidebarPx: (px) =>
    set((state) => {
      const sidebarPx = clamp(px, MIN_SIDEBAR_PX, MAX_SIDEBAR_PX);
      writeLayout(sidebarPx, state.topicPanelExpanded);
      return { sidebarPx };
    }),
  setTopicPanelExpanded: (expanded) =>
    set((state) => {
      writeLayout(state.sidebarPx, expanded);
      return { topicPanelExpanded: expanded };
    }),
}));

