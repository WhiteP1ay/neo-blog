import Link from 'next/link';
import { SiteThemeSwitcher } from '@/components/site/SiteThemeSwitcher';
import { DocContainer } from './DocContainer';
import { SiteHeaderAuthNav } from './SiteHeaderAuthNav';
import { SiteHeaderLangSwitch } from './SiteHeaderLangSwitch';
import { SiteLogoLink } from './SiteLogoLink';
import { SiteHeaderSearchLink } from './SiteHeaderSearchLink';

const navLinkClass =
  'cursor-pointer rounded-md px-2 py-1 text-sm text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-accent/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background';

const navButtonClass = `${navLinkClass} inline-flex items-center justify-center border-0 bg-transparent font-inherit`;

/**
 * 站点头部：粘性顶栏、语义色导航与主题切换。
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 py-4 backdrop-blur-sm supports-backdrop-filter:bg-background/70">
      <DocContainer>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <SiteLogoLink className="inline-flex cursor-pointer text-base font-semibold tracking-tight text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background rounded-md px-1 py-0.5 -mx-1" />
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:pt-0.5">
            <nav aria-label="主导航" className="flex flex-wrap items-center gap-1">
              <SiteHeaderAuthNav navLinkClass={navLinkClass} navButtonClass={navButtonClass} />
              <SiteHeaderSearchLink className={navLinkClass} />
              <Link href="/admin" className={navLinkClass}>
                Admin
              </Link>
            </nav>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <SiteHeaderLangSwitch />
              <SiteThemeSwitcher className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </DocContainer>
    </header>
  );
}
