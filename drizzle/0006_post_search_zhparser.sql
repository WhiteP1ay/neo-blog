CREATE EXTENSION IF NOT EXISTS zhparser;--> statement-breakpoint
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'chinese') THEN
    CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);
    ALTER TEXT SEARCH CONFIGURATION chinese
      ADD MAPPING FOR n, v, a, i, e, l, j WITH simple;
  END IF;
END
$do$;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "plainBody" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_search_vector_idx" ON "posts" USING gin ("searchVector");
