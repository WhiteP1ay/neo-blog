import type { InferSelectModel } from "drizzle-orm";
import type {
  analyticsTable,
  commentsTable,
  postsTable,
  topicPostsTable,
  toolsTable,
  topicsTable,
} from "@/server/db/schema";

export type Post = InferSelectModel<typeof postsTable>;
export type Comment = InferSelectModel<typeof commentsTable>;
export type Topic = InferSelectModel<typeof topicsTable>;
export type TopicPost = InferSelectModel<typeof topicPostsTable>;
export type Tool = InferSelectModel<typeof toolsTable>;
export type Analytics = InferSelectModel<typeof analyticsTable>;
