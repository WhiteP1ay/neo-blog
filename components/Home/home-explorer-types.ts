/** 与 RSC 传入的 JSON 一致：日期已序列化为 ISO 字符串 */
export type HomeExplorerCategoryPayload = {
  topicKey: 'uncategorized' | number;
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

export type HomeExplorerPostDetailPayload = {
  id: number;
  title: string;
  /** 服务端 Shiki 高亮后的 HTML，只读展示 */
  content: string;
  /** 数据库原始 HTML，仅 TipTap 编辑使用（勿与 content 混用） */
  contentSource: string;
  createdAt: string | null;
  updatedAt: string | null;
};
