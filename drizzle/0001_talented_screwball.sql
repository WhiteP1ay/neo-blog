ALTER TABLE "explorer_nodes" ADD COLUMN "code" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "explorer_nodes_code_unique_idx" ON "explorer_nodes" USING btree ("code");