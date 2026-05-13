ALTER INDEX "post_types_slug_unique_idx" RENAME TO "post_types_code_unique_idx";
--> statement-breakpoint
ALTER TABLE "post_types" RENAME COLUMN "slug" TO "code";
