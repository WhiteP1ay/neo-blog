import type { ReactNode } from 'react';

/**
 * 英文前台子树：`lang` 供无障碍与阅读器；`contents` 避免多包一层块级盒影响布局。
 */
export default function EnSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="contents" lang="en">
      {children}
    </div>
  );
}
