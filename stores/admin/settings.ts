'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Admin 文章编辑模式：
 * - traditional：原有的内嵌弹窗 / 表格行内编辑流程
 * - zen：全屏沉浸式富文本编辑器，标题与 type 由 h1/【type】 自动派生
 */
export type AdminEditMode = 'traditional' | 'zen';

type AdminSettingsState = {
  editMode: AdminEditMode;
  setEditMode: (mode: AdminEditMode) => void;
};

/**
 * Admin 个性化设置（仅本地持久化，跨设备不同步）。
 */
export const useAdminSettings = create<AdminSettingsState>()(
  persist(
    (set) => ({
      editMode: 'traditional',
      setEditMode: (editMode) => set({ editMode }),
    }),
    {
      name: 'admin-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
