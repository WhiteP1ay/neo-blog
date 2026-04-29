/**
 * 管理端 UI 状态 store（zustand）。
 */

import { create } from 'zustand';

type RenameTopicState = { id: number; name: string } | null;
type RenamePostState = { id: number; title: string } | null;

type AdminUiState = {
  editingPost: boolean;

  // 新建专题
  newTopicOpen: boolean;
  newTopicName: string;

  // 重命名专题
  renameTopicState: RenameTopicState;
  // 删除专题
  deleteTopicId: number | null;

  // 重命名文章
  renamePostState: RenamePostState;
  // 删除文章
  deletePostId: number | null;

  // 拖拽上传态（文章列表区域）
  listDropActive: boolean;

  setEditingPost: (v: boolean) => void;

  setNewTopicOpen: (open: boolean) => void;
  setNewTopicName: (name: string) => void;
  openNewTopicDialog: () => void;
  closeNewTopicDialog: () => void;

  setRenameTopicState: (s: RenameTopicState) => void;
  setDeleteTopicId: (id: number | null) => void;

  setRenamePostState: (s: RenamePostState) => void;
  setDeletePostId: (id: number | null) => void;

  setListDropActive: (active: boolean) => void;
};

export const useAdminUiStore = create<AdminUiState>((set) => ({
  editingPost: false,

  newTopicOpen: false,
  newTopicName: '',

  renameTopicState: null,
  deleteTopicId: null,

  renamePostState: null,
  deletePostId: null,

  listDropActive: false,

  setEditingPost: (v) => set({ editingPost: v }),

  setNewTopicOpen: (open) => set({ newTopicOpen: open }),
  setNewTopicName: (name) => set({ newTopicName: name }),
  openNewTopicDialog: () => set({ newTopicOpen: true, newTopicName: '' }),
  closeNewTopicDialog: () => set({ newTopicOpen: false }),

  setRenameTopicState: (s) => set({ renameTopicState: s }),
  setDeleteTopicId: (id) => set({ deleteTopicId: id }),

  setRenamePostState: (s) => set({ renamePostState: s }),
  setDeletePostId: (id) => set({ deletePostId: id }),

  setListDropActive: (active) => set({ listDropActive: active }),
}));

