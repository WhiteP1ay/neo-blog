'use client';

/**
 * Home Explorer 底部栏（目前占位，便于未来加状态/快捷键提示等）。
 */

export function HomeExplorerFooter() {
  return (
    <footer className="border-border bg-muted/30 shrink-0 border-t">
      <div className="text-muted-foreground flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2 text-xs">
        <span className="text-center opacity-80">© 2026 White Meta. 保留所有权利。</span>
      </div>
    </footer>
  );
}

