import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const POSTS_DIR = process.env.POSTS_DIR || path.join(process.cwd(), "posts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  type?: string;
  tags?: string[];
  coverUrl?: string;
  excerpt?: string;
}

export interface Post extends PostMeta {
  contentHtml: string;
  rawMarkdown: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  if (!raw.startsWith("---")) {
    return { meta: {}, body: raw };
  }
  const end = raw.indexOf("---", 3);
  if (end === -1) {
    return { meta: {}, body: raw };
  }
  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 3).trim();

  const meta: Record<string, unknown> = {};
  for (const line of fmBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: string | string[] = line.slice(colonIdx + 1).trim();

    // Parse YAML array syntax: [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }

    meta[key] = value;
  }

  return { meta, body };
}

function generateExcerpt(html: string, maxLen = 200): string {
  const text = html
    .replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, "") // 去掉标题
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function readPost(filePath: string): Post | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { meta, body } = parseFrontmatter(raw);

    const slug = path.basename(filePath, ".md");
    const title = (meta.title as string) || slug;
    const date = (meta.date as string) || "";
    const type = (meta.type as string) || undefined;
    const tags = Array.isArray(meta.tags)
      ? meta.tags
      : typeof meta.tags === "string"
        ? [meta.tags]
        : undefined;
    const coverUrl = (meta.coverUrl as string) || undefined;

    const contentHtml = marked.parse(body, { async: false }) as string;
    const excerpt = generateExcerpt(contentHtml);

    return {
      slug,
      title,
      date,
      type,
      tags,
      coverUrl,
      excerpt,
      contentHtml,
      rawMarkdown: body,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

  const posts = files
    .map((f) => readPost(path.join(POSTS_DIR, f)))
    .filter((p): p is Post => p !== null);

  // Sort by date descending
  posts.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return readPost(filePath);
}

export function getPostsByType(type: string): Post[] {
  return getAllPosts().filter((p) => p.type === type);
}

export function getAllTypes(): string[] {
  const types = new Set<string>();
  for (const post of getAllPosts()) {
    if (post.type) types.add(post.type);
  }
  return Array.from(types).sort();
}
