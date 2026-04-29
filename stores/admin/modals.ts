/**
 * 全站通用弹层（SiteModals）store（zustand）。
 */

import { create } from 'zustand';
import type { SiteModalId } from '@/types/admin/layout';

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

export function openSiteModal(id: SiteModalId) {
  useSiteModalsStore.getState().open(id);
}

export function closeSiteModal() {
  useSiteModalsStore.getState().close();
}

