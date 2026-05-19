# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**neo-blog** ("White Meta") is a bilingual (Chinese/English) personal blog and photo gallery with an admin console, built as a single **Next.js 15** App Router application with **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Drizzle ORM** over **PostgreSQL**, and **Biome** for linting/formatting.

### Key commands

| Action | Command |
|---|---|
| Dev server | `pnpm dev` (port 3000, Turbopack) |
| Lint | `pnpm lint` (Biome; has 4 pre-existing a11y/lint errors) |
| E2E tests (all) | `pnpm test:e2e` |
| E2E tests (site only) | `pnpm test:e2e --project=setup --project=site` |
| DB migrations | `pnpm drizzle-kit push` |
| Seed admin | `pnpm db:seed-admin` (requires `ADMIN_NAME` + `ADMIN_PASSWORD` in `.env`) |

### Database

PostgreSQL runs locally (installed via `apt`). The update script starts it automatically. Connection details are in `.env` (variable `DATABASE_URL`). SSL is disabled in development (`DB_SSL_DISABLE` not needed; the code defaults to no-SSL outside production).

To reset the database from scratch: drop and recreate the `neo_blog` database, re-run `pnpm drizzle-kit push`, then `pnpm db:seed-admin`.

### Environment variables

See `.env.example` for the full list. Required for development:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_JWT_SECRET` — JWT signing key (≥32 bytes hex)
- `ADMIN_NAME` / `ADMIN_PASSWORD` — for seeding the admin user

For E2E admin tests, also set `E2E_ADMIN_USER` and `E2E_ADMIN_PASSWORD` in `.env`.

Optional (external services): `OSS_*` for Alibaba Cloud OSS photo uploads, `DEEPSEEK_API_KEY` for AI features.

### Playwright E2E

Chromium is the only required browser (`pnpm exec playwright install chromium`). The Playwright config auto-starts the dev server if not already running. Without `E2E_ADMIN_USER`/`E2E_ADMIN_PASSWORD`, admin tests are skipped gracefully.

### Git hooks

Husky is configured with a `pre-push` hook (currently empty). Commit messages must be in Chinese following Conventional Commits (see `.cursorrules`).

### Gotchas

- The Biome lint command (`pnpm lint`) uses `--write` flag and will auto-fix fixable issues. There are 4 pre-existing a11y errors in the codebase that cause lint to exit non-zero.
- The dev server's first request after startup is slow (~5-7s) due to Turbopack compilation. Subsequent requests are fast.
- `pnpm-workspace.yaml` only configures `allowBuilds` for `esbuild` and `sharp`; this is not a monorepo.
