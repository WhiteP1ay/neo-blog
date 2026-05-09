'use client';

import { type ReactNode, useEffect } from 'react';

/** 与 global.css 中 `.scrollbar-subtle` / `html.scrollbar-subtle` 配套，挂载时为文档根节点加上该类以美化 admin 视口滚动条。 */
const ADMIN_DOCUMENT_SCROLLBAR_CLASS = 'scrollbar-subtle';

export function AdminDocumentScrollbar({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add(ADMIN_DOCUMENT_SCROLLBAR_CLASS);
    return () => document.documentElement.classList.remove(ADMIN_DOCUMENT_SCROLLBAR_CLASS);
  }, []);

  return children;
}
