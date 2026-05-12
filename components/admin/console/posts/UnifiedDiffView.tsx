'use client';

import { cn } from '@/lib/utils';

type DiffRowKind = 'header' | 'add' | 'remove' | 'context' | 'other';

function classifyLine(line: string): DiffRowKind {
  if (
    line.startsWith('---') ||
    line.startsWith('+++') ||
    line.startsWith('@@') ||
    line.startsWith('Index:') ||
    line.startsWith('diff ') ||
    line.startsWith('===')
  ) {
    return 'header';
  }
  if (line.startsWith('+')) return 'add';
  if (line.startsWith('-')) return 'remove';
  if (line.startsWith(' ')) return 'context';
  return 'other';
}

export function UnifiedDiffView({ unified, className }: { unified: string; className?: string }) {
  const lines = unified.split('\n');

  return (
    <div className={cn('overflow-x-auto rounded-md border border-border', className)}>
      <div className="min-w-0 font-mono text-xs leading-relaxed">
        {lines.map((line, i) => {
          const kind = classifyLine(line);
          const body = line.slice(1);
          const rowKey = `${i}:${line.length}:${line.slice(0, 48)}`;
          const rowBg =
            kind === 'add'
              ? 'bg-emerald-500/12 dark:bg-emerald-500/20'
              : kind === 'remove'
                ? 'bg-red-500/12 dark:bg-red-500/20'
                : kind === 'header'
                  ? 'bg-muted/80 text-muted-foreground'
                  : 'bg-transparent';

          return (
            <div key={rowKey} className={cn('flex border-b border-border/40 last:border-b-0', rowBg)}>
              <span
                className={cn(
                  'w-7 shrink-0 select-none border-r border-border/50 px-1 py-0.5 text-center text-[10px] font-semibold tabular-nums text-muted-foreground',
                  kind === 'add' && 'text-emerald-700 dark:text-emerald-400',
                  kind === 'remove' && 'text-red-700 dark:text-red-400',
                )}
                aria-hidden
              >
                {kind === 'add' ? '+' : kind === 'remove' ? '−' : kind === 'context' ? ' ' : '·'}
              </span>
              <pre className="m-0 flex-1 whitespace-pre-wrap break-all px-1.5 py-0.5 text-[11px] leading-snug">
                {kind === 'header' || kind === 'other' ? line : body}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
