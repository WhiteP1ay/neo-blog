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
CREATE TABLE "photos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "photos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT '' NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"description" text,
	"coverUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT '' NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
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
CREATE INDEX "comments_target_idx" ON "comments" USING btree ("targetType","targetId");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parentId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_name_unique_idx" ON "users" USING btree ("name");