import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Book,
  LogIn,
  Settings,
  //  Github, Tv, Youtube
} from 'lucide-react';
import { getSession } from '@/server/utils/auth';

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
  const session = await getSession();
  const isAdminLoggedIn = session?.isAdmin === true;

  return (
    <div className="bg-background min-h-dvh">
      <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6">
        <header className="h-12 shrink-0" aria-hidden />
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto">
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
            <Button asChild variant="outline">
              <Link href={isAdminLoggedIn ? '/admin' : '/login'}>
                {isAdminLoggedIn ? <Settings className="size-4" /> : <LogIn className="size-4" />}
                {isAdminLoggedIn ? '管理' : '登录'}
              </Link>
            </Button>
          </div>

        </section>
        <footer className="text-muted-foreground h-12 shrink-0 flex items-center justify-center text-xs">
          <span>© {new Date().getFullYear()} White Meta</span>
        </footer>
      </main>
    </div>
  );
}
