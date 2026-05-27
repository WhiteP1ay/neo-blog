'use client';

import type { PostTypeAdminRow } from '@/components/admin/console/types';

export function TypeMultiSelect({
  availableTypes,
  value,
  onChange,
  disabled,
}: {
  availableTypes: PostTypeAdminRow[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled: boolean;
}) {
  const set = new Set(value);
  const toggle = (id: number) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(availableTypes.filter((t) => next.has(t.id)).map((t) => t.id));
  };

  return (
    <details className="relative max-w-xl rounded border border-dashed border-border bg-muted/20 px-3 py-2 text-sm">
      <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
        文章类型
        {value.length > 0 ? (
          <span className="ml-2 text-foreground">（已选 {value.length}）</span>
        ) : (
          <span className="ml-2">（可选）</span>
        )}
      </summary>
      <div className="mt-2 max-h-40 space-y-2 overflow-y-auto overscroll-y-contain pr-1">
        {availableTypes.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无类型，请先在「类型管理」中创建。</p>
        ) : (
          availableTypes.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/60"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border border-input"
                checked={set.has(t.id)}
                disabled={disabled}
                onChange={() => toggle(t.id)}
              />
              <span>
                {t.nameZh}
                <span className="text-muted-foreground"> · {t.code}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </details>
  );
}
