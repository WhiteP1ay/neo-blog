CREATE TABLE "analytics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar(50) NOT NULL,
	"action" varchar(100),
	"target" varchar(255),
	"url" varchar(500),
	"ip" varchar(45),
	"userAgent" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"targetType" varchar(16) NOT NULL,
	"targetId" integer NOT NULL,
	"parentId" integer,
	"author" varchar(255) NOT NULL,
	"email" varchar(255),
	"content" text NOT NULL,
	"ip" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explorer_nodes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "explorer_nodes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"parentId" integer,
	"name" varchar(255) NOT NULL,
	"nodeType" varchar(20) NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"allowComment" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "photos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nodeId" integer NOT NULL,
	"fileUrl" text,
	"objectKey" varchar(500),
	"size" integer,
	"mimeType" varchar(120),
	"width" integer,
	"height" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nodeId" integer,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"markdownContent" text,
	"coverUrl" text,
	"excerpt" text,
	"isPinned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"isAdmin" boolean DEFAULT false NOT NULL,
	"isVip" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_nodeId_explorer_nodes_id_fk" FOREIGN KEY ("nodeId") REFERENCES "public"."explorer_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_nodeId_explorer_nodes_id_fk" FOREIGN KEY ("nodeId") REFERENCES "public"."explorer_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_target_idx" ON "comments" USING btree ("targetType","targetId");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "explorer_nodes_parent_sort_idx" ON "explorer_nodes" USING btree ("parentId","sortOrder");--> statement-breakpoint
CREATE INDEX "explorer_nodes_type_idx" ON "explorer_nodes" USING btree ("nodeType");--> statement-breakpoint
CREATE UNIQUE INDEX "photos_node_unique_idx" ON "photos" USING btree ("nodeId");