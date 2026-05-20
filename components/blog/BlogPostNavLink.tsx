'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type NextLinkProps = ComponentProps<typeof Link>;

export type BlogPostNavLinkProps = Omit<NextLinkProps, 'href' | 'prefetch'> & {
  href: string;
  innerClassName?: string;
  prefetch?: boolean;
};

function shouldIgnoreNavigationModifiers(e: React.MouseEvent | React.PointerEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
}

/**
 * 文章详情链接：在 Next 下发 RSC / 展示 loading 之前，用本地 pending 状态立即给出点击反馈；
 * 默认全量 prefetch，生产环境更易在视口内预热目标页。
 */
export function BlogPostNavLink({
  className,
  innerClassName,
  children,
  href,
  prefetch = true,
  onClick,
  onPointerDown,
  ...rest
}: BlogPostNavLinkProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname 变化时重置 pending（effect 本体无需读取 pathname）
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const pending = pendingHref === href;

  const armPending = useCallback(() => {
    setPendingHref(href);
  }, [href]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(e);
      if (e.defaultPrevented) return;
      if (shouldIgnoreNavigationModifiers(e)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      armPending();
    },
    [armPending, onPointerDown],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (shouldIgnoreNavigationModifiers(e)) return;
      if (e.button !== 0) return;
      armPending();
    },
    [armPending, onClick],
  );

  return (
    <Link
      {...rest}
      href={href}
      prefetch={prefetch}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={cn('relative', className, pending && 'cursor-wait')}
    >
      <div
        className={cn(
          innerClassName,
          pending && 'opacity-[0.72] motion-safe:transition-opacity motion-safe:duration-150',
        )}
      >
        {children}
      </div>
    </Link>
  );
}
