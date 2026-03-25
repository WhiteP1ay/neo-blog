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

/** 非组件内（导航点击等）直接打开 */
export function openSiteModal(id: SiteModalId) {
  useSiteModalsStore.getState().open(id);
}

export function closeSiteModal() {
  useSiteModalsStore.getState().close();
}
