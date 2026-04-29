import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Book,
  //  Github, Tv, Youtube
} from 'lucide-react';

// import { SOCIAL_LINKS } from '@/app/constants';

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
          <h1 className="md:text-4xl text-2xl font-bold">欢迎来到 White Meta</h1>
          <p className="text-lg text-muted-foreground">这里是白玩dev的个人网站</p>
          <p className="md:text-lg text-muted-foreground text-sm">白玩dev：一个程序员/佛系青年/摩托佬/业余吉他手</p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={'/blog'}>
                <Book className="size-4" />
                进入 Blog
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
