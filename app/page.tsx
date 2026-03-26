import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book, Github, Tv, Youtube } from 'lucide-react';
import { SOCIAL_LINKS } from '@/app/constants';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'White Meta',
  description: '白玩dev的个人网站',
  keywords: ['博客', '技术文章', '编程', '开发', '工具', '简历编辑器', '面试题库'],
  openGraph: {
    title: 'White Meta',
    description: '白玩dev的个人网站',
    type: 'website',
  },
};

export default async function Home() {
  return (
    <div className="bg-background min-h-dvh">
      <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6">
        <section className="flex flex-col gap-4 flex-1 justify-center items-center">
          <h1 className="text-4xl font-bold">White Meta</h1>
          <p className="text-lg text-muted-foreground">白玩dev,一个程序员/佛学爱好者/摩托佬/业余吉他手</p>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                GitHub
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer">
                <Youtube className="size-4" />
                YouTube
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href={SOCIAL_LINKS.bilibili} target="_blank" rel="noopener noreferrer">
                <Tv className="size-4" />
                Bilibili
              </a>
            </Button>
            <Button asChild>
              <Link href="/b">
                <Book className="size-4" />
                Blog
              </Link>
            </Button>
          </div>

        </section>
        <footer className="text-muted-foreground flex h-16 items-center justify-center text-xs">
          <span>© {new Date().getFullYear()} White Meta</span>
        </footer>
      </main>
    </div>
  );
}
