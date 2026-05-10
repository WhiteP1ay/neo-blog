import Link from 'next/link';
import { SiteThemeSwitcher } from '@/components/site/SiteThemeSwitcher';
import { DocContainer } from './DocContainer';

const navLinkClass =
  'cursor-pointer rounded-md px-2 py-1 text-sm text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-accent/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background';

/**
 * 站点头部：粘性顶栏、语义色导航与主题切换。
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70">
      <DocContainer>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="cursor-pointer text-base font-semibold tracking-tight text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background rounded-md px-1 py-0.5 -mx-1"
            >
              White Meta
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-2">
            <nav aria-label="主导航" className="flex flex-wrap items-center gap-1">
              <Link href="/login" className={navLinkClass}>
                登录
              </Link>
              <Link href="/admin" className={navLinkClass}>
                Admin
              </Link>
            </nav>
            <SiteThemeSwitcher className="text-muted-foreground sm:ml-1" />
          </div>
        </div>
      </DocContainer>
    </header>
  );
}
