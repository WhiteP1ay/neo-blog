import type { ReactNode } from 'react';

type DocContainerProps = {
  children: ReactNode;
};

/**
 * 站点统一文档容器：
 * - 控制最大阅读宽度
 * - 兼容手机端留白
 */
export function DocContainer({ children }: DocContainerProps) {
  return <div className="site-doc-container">{children}</div>;
}
