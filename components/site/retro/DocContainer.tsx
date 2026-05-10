import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DocContainerProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 站点统一文档容器：最大阅读宽度与水平留白（与前台壳层一致）。
 */
export function DocContainer({ children, className }: DocContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-3xl px-4 sm:px-6', className)}>{children}</div>
  );
}
