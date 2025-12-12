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
