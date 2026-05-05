/**
 * Admin 控制台可切换的功能标签。
 */
export type TabKey = 'users' | 'posts' | 'photos' | 'comments';

/**
 * 用户条目模型。
 */
export type UserItem = {
  id: number;
  name: string;
  isAdmin: boolean;
};

/**
 * 博文条目模型。
 */
export type PostItem = {
  id: number;
  title: string;
  type: string;
  isHidden: boolean;
  content: string;
  markdownContent: string | null;
  excerpt: string | null;
  coverUrl: string | null;
};

/**
 * 照片条目模型。
 */
export type PhotoItem = {
  id: number;
  title: string;
  type: string;
  isHidden: boolean;
  coverUrl: string | null;
  description: string | null;
};

/**
 * 评论条目模型。
 */
export type CommentItem = {
  id: number;
  targetType: string;
  targetId: number;
  author: string;
  content: string;
};
