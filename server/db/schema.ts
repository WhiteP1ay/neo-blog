import { integer, pgTable, timestamp, varchar, text, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 用户表
 */
export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isAdmin: boolean().notNull().default(false),
  isVip: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
  nameUniqueIndex: uniqueIndex('users_name_unique_idx').on(table.name),
}));

/**
 * 文章表
 */
export const postsTable = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull().default(''),
  sortOrder: integer().notNull().default(0),
  isHidden: boolean().notNull().default(false),
  content: text().notNull(), // 存储解析后的HTML
  markdownContent: text(), // 存储原始Markdown（可选，用于下载）
  coverUrl: text(), // 从正文中提取的首图 URL
  excerpt: text(), // 纯文本摘要（约 100 字）
  isPinned: boolean().notNull().default(false), // 是否置顶
  createdAt: timestamp(), // 创建时间（可为空）
  updatedAt: timestamp(), // 修改时间（可为空）
});

/**
 * 照片表
 */
export const photosTable = pgTable('photos', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull().default(''),
  isHidden: boolean().notNull().default(false),
  description: text(),
  coverUrl: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

/**
 * 评论表
 */
export const commentsTable = pgTable('comments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  targetType: varchar({ length: 16 }).notNull(), // post | photo
  targetId: integer().notNull(),
  parentId: integer(), // 回复的父评论ID，null表示顶级评论
  author: varchar({ length: 255 }).notNull(), // 评论者昵称
  email: varchar({ length: 255 }), // 邮箱（可选）
  content: text().notNull(),
  ip: varchar({ length: 45 }), // 存储IP地址
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
  targetIndex: index('comments_target_idx').on(table.targetType, table.targetId),
  parentIndex: index('comments_parent_idx').on(table.parentId),
}));

export const postsRelations = relations(postsTable, () => ({}));
