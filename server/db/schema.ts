import { integer, pgTable, timestamp, varchar, text, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * 用户表
 */
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

/**
 * 文章表
 */
export const postsTable = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(), // 存储解析后的HTML
  markdownContent: text(), // 存储原始Markdown（可选，用于下载）
  isPinned: boolean().notNull().default(false), // 是否置顶
  createdAt: timestamp(), // 创建时间（可为空）
  updatedAt: timestamp(), // 修改时间（可为空）
});

/**
 * 评论表
 */
export const commentsTable = pgTable("comments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  postId: integer().notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  parentId: integer(), // 回复的父评论ID，null表示顶级评论
  author: varchar({ length: 255 }).notNull(), // 评论者昵称
  email: varchar({ length: 255 }), // 邮箱（可选）
  content: text().notNull(),
  ip: varchar({ length: 45 }), // 存储IP地址
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

/**
 * 埋点数据表
 */
export const analyticsTable = pgTable("analytics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: varchar({ length: 50 }).notNull(), // 事件类型：page_view, comment, etc.
  action: varchar({ length: 100 }), // 具体操作
  target: varchar({ length: 255 }), // 目标：post_id, comment_id, etc.
  url: varchar({ length: 500 }), // 页面URL
  ip: varchar({ length: 45 }), // 用户IP
  userAgent: text(), // 用户代理
  metadata: text(), // JSON格式的额外数据
  createdAt: timestamp().notNull().defaultNow(),
});

/**
 * 专题表
 */
export const topicsTable = pgTable("topics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(), // 专题名称
  description: text(), // 专题描述（可选）
  coverImage: text(), // 封面图（base64 格式，存储在数据库中）
  isPinned: boolean().notNull().default(false), // 是否置顶
  isHidden: boolean().notNull().default(false), // 是否隐藏
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

/**
 * 专题-文章关联表（多对多关系，带排序）
 */
export const topicPostsTable = pgTable("topic_posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  topicId: integer().notNull().references(() => topicsTable.id, { onDelete: "cascade" }),
  postId: integer().notNull().references(() => postsTable.id, { onDelete: "cascade" }),
  sortOrder: integer().notNull().default(0), // 排序顺序
  createdAt: timestamp().notNull().defaultNow(),
});

// 定义关系
export const topicsRelations = relations(topicsTable, ({ many }) => ({
  topicPosts: many(topicPostsTable),
}));

export const postsRelations = relations(postsTable, ({ many }) => ({
  topicPosts: many(topicPostsTable),
}));

export const topicPostsRelations = relations(topicPostsTable, ({ one }) => ({
  topic: one(topicsTable, {
    fields: [topicPostsTable.topicId],
    references: [topicsTable.id],
  }),
  post: one(postsTable, {
    fields: [topicPostsTable.postId],
    references: [postsTable.id],
  }),
}));