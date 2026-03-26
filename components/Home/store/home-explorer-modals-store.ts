/**
 * 全站通用弹层（SiteModals）store（zustand）。
 *
 * 使用方式：
 * - 组件内：`useSiteModalsStore((s) => s.active)` 等
 * - 组件外（如导航点击）：调用 `openSiteModal` / `closeSiteModal`
 */

import { create } from 'zustand';
import type { SiteModalId } from '@/app/nav';

type SiteModalsState = {
  active: SiteModalId | null;
  open: (id: SiteModalId) => void;
  close: () => void;
};

export const useSiteModalsStore = create<SiteModalsState>((set) => ({
  active: null,
  open: (id) => set({ active: id }),
  close: () => set({ active: null }),
}));

/** 非组件内（例如导航点击）直接打开 */
export function openSiteModal(id: SiteModalId) {
  useSiteModalsStore.getState().open(id);
}

/** 非组件内直接关闭 */
export function closeSiteModal() {
  useSiteModalsStore.getState().close();
}

