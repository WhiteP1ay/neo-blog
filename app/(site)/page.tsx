import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'White Meta',
  description: '白玩dev 的个人网站',
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Hi, I&apos;m 白玩dev</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">全栈开发 / 内容创作 / 科技爱好者</p>

      <div className="mt-12 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>🎸 吉他新手 · ☸️ 佛学爱好者 · 🏍️ 摩托佬 · 📖 持续成长</p>
      </div>

      <div className="mt-10 text-left text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Tech Stack</p>
        <div className="mt-2.5 space-y-1.5">
          <p>
            <span className="text-muted-foreground/70">Frontend</span> React · Next.js · Vue.js · TypeScript ·
            TailwindCSS
          </p>
          <p>
            <span className="text-muted-foreground/70">Backend</span> Node.js · Express · NestJS
          </p>
          <p>
            <span className="text-muted-foreground/70">Database</span> MySQL · MongoDB · Redis
          </p>
          <p>
            <span className="text-muted-foreground/70">DevOps</span> Docker · CI/CD
          </p>
        </div>
      </div>

      <div className="mt-12">
        <Link
          href="/blog"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:brightness-95"
        >
          文章
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="mt-10 flex items-center justify-center gap-5 text-muted-foreground">
        <a
          href="https://github.com/WhiteP1ay"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-150 hover:text-foreground"
          title="GitHub"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>
        <a
          href="https://space.bilibili.com/107889531"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-150 hover:text-foreground"
          title="Bilibili"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="15" x="2" y="3" rx="2" />
            <polyline points="8 21 12 17 16 21" />
          </svg>
        </a>
        <a
          href="mailto:parkhaocer@gmail.com"
          className="transition-colors duration-150 hover:text-foreground"
          title="Email"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
