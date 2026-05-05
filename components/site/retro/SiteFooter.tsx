import { DocContainer } from './DocContainer';

/**
 * 复古站点页脚：保持低干扰，仅保留版权和回到顶部入口。
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-4">
      <DocContainer>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} White Meta</p>
          <a href="#top" className="underline underline-offset-4 hover:opacity-80">
            回到顶部
          </a>
        </div>
      </DocContainer>
    </footer>
  );
}
