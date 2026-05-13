'use client';

import type { TabKey } from './types';

const TAB_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: 'posts', label: '博文管理' },
  { key: 'post-types', label: '类型管理' },
  { key: 'home', label: '首页精选' },
  { key: 'photos', label: '照片管理' },
  { key: 'users', label: '用户管理' },
  { key: 'comments', label: '评论管理' },
];

/**
 * Admin 页面内部 tab 导航。
 */
export function TabNav({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <div className="flex gap-2">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className="min-h-10 touch-manipulation rounded border px-3 py-2 text-sm sm:min-h-0 sm:py-1"
          type="button"
          onClick={() => onChange(item.key)}
          aria-pressed={activeTab === item.key}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
