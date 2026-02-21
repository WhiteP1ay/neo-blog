"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * 根据路径生成面包屑
 */
function generateBreadcrumbs(pathname: string | null): BreadcrumbItem[] {
  if (!pathname) return [];

  const items: BreadcrumbItem[] = [{ label: "首页", href: "/" }];

  // 移除开头的斜杠并分割路径
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return items;
  }

  // 处理特殊路径
  if (segments[0] === "me") {
    items.push({ label: "About", href: "/me" });
    return items;
  }

  if (segments[0] === "topics") {
    items.push({ label: "专题", href: "/topics" });
    if (segments.length > 1) {
      // 专题详情页，需要动态获取专题名称
      items.push({ label: "专题详情", href: `/topics/${segments[1]}` });
    }
    return items;
  }

  if (segments[0] === "tools") {
    items.push({ label: "工具", href: "/tools" });
    return items;
  }

  if (segments[0] === "admin") {
    items.push({ label: "管理后台", href: "/admin" });
    return items;
  }

  // 处理文章页面（数字ID）
  if (/^\d+$/.test(segments[0])) {
    items.push({ label: "文章", href: `/${segments[0]}` });
    return items;
  }

  // 其他路径，使用路径名作为标签
  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    items.push({ label: segment, href });
  });

  return items;
}

interface BreadcrumbProps {
  /**
   * 自定义当前页面的标签（用于动态内容如文章标题、专题名称）
   */
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
    <nav className="text-sm text-gray-600 dark:text-gray-300 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400 dark:text-gray-600" aria-hidden="true">
                  /
                </span>
              )}
              {isLast ? (
                <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
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

