'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const ROOT_SEGMENT_LABEL_MAP: Record<string, string> = {
  me: 'About',
  about: 'About',
  topics: '专题',
  tools: '工具',
  blog: '博客',
};

/**
 * 根据路径生成面包屑
 */
function generateBreadcrumbs(pathname: string | null): BreadcrumbItem[] {
  if (!pathname) return [];

  const items: BreadcrumbItem[] = [{ label: '首页', href: '/' }];

  // 移除开头的斜杠并分割路径
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return items;
  }

  const [root, ...rest] = segments;
  const rootLabel = ROOT_SEGMENT_LABEL_MAP[root];

  if (rootLabel) {
    items.push({ label: rootLabel, href: `/${root}` });
    if (root === 'blog' && rest.length > 0) {
      // 博客详情页或其他子页面
      items.push({ label: '文章', href: `/${segments.join('/')}` });
    }
    return items;
  }

  // 纯数字路径兼容：默认视作旧博客文章路径
  if (/^\d+$/.test(root)) {
    items.push({ label: '博客', href: '/blog' });
    items.push({ label: '文章', href: `/${root}` });
    return items;
  }

  // 其他路径，使用路径名作为标签
  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    items.push({ label: segment, href });
  });

  return items;
}

interface BreadcrumbProps {
  currentLabel?: string;
}

/**
 * 面包屑导航组件
 */
export function Breadcrumb({ currentLabel }: BreadcrumbProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const items = generateBreadcrumbs(pathname);
    // 如果有自定义标签，替换最后一个
    if (currentLabel && items.length > 0) {
      items[items.length - 1] = {
        ...items[items.length - 1],
        label: currentLabel,
      };
    }
    setBreadcrumbs(items);
  }, [pathname, currentLabel]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="mb-4 text-sm text-foreground/80" aria-label="Breadcrumb">
      <ol className="m-0 flex flex-wrap items-center gap-x-1 gap-y-1 p-0">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={item.href} className="list-none">
              {index > 0 ? (
                <span className="px-1 text-foreground/60" aria-hidden="true">
                  &gt;
                </span>
              ) : null}
              {isLast ? (
                <span className="text-foreground">{item.label}</span>
              ) : (
                <Link href={item.href} className="underline underline-offset-4 hover:opacity-80">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

