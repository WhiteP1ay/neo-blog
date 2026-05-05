import Link from 'next/link';
import { SiteThemeSwitcher } from '@/components/site/SiteThemeSwitcher';
import { DocContainer } from './DocContainer';

/**
 * 复古站点头部：文档式标题 + 极简导航 + 主题切换。
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border/70 py-4">
      <DocContainer>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="tracking-[0.2em] text-muted-foreground">
              White Meta
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <nav aria-label="主导航" className="flex items-center gap-3">
              <Link href="/login" className="underline underline-offset-4 hover:opacity-80">
                登录
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/admin" className="underline underline-offset-4 hover:opacity-80">
                Admin
              </Link>
            </nav>
            <SiteThemeSwitcher className="text-muted-foreground" />
          </div>
        </div>
      </DocContainer>
    </header>
  );
}
