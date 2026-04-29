import type { InferSelectModel } from "drizzle-orm";
import type {
  analyticsTable,
  commentsTable,
  explorerNodesTable,
  photosTable,
  postsTable,
} from "@/server/db/schema";

export type Post = InferSelectModel<typeof postsTable>;
export type Comment = InferSelectModel<typeof commentsTable>;
export type Analytics = InferSelectModel<typeof analyticsTable>;
export type ExplorerNode = InferSelectModel<typeof explorerNodesTable>;
export type Photo = InferSelectModel<typeof photosTable>;
