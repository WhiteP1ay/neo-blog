/** 专题 + 其下文章列表（用于左侧专题栏与中间文章列表） */
export type HomeExplorerCategoryPayload = {
  topicKey: number;
  name: string;
  isPinned: boolean;
  sortOrder: number;
  createdAt: string | null;
  posts: Array<{
    id: number;
    title: string;
    createdAt: string | null;
    isPinned: boolean;
  }>;
};

/** 文章详情（用于右侧阅读/编辑面板） */
export type HomeExplorerPostDetailPayload = {
  id: number;
  title: string;
  /** 服务端高亮后的 HTML，只读展示 */
  content: string;
  /** 数据库原始 HTML，仅 TipTap 编辑使用（勿与 content 混用） */
  contentSource: string;
  createdAt: string | null;
  updatedAt: string | null;
};

