import { DocContainer } from './DocContainer';

const footerLinkClass =
  'cursor-pointer rounded-md px-2 py-1 text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-accent/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background';

/**
 * 站点页脚：低干扰版权与回到顶部。
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-6">
      <DocContainer>
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} White Meta</p>
          <a href="#top" className={footerLinkClass}>
            回到顶部
          </a>
        </div>
      </DocContainer>
    </footer>
  );
}
