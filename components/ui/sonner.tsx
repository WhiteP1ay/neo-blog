'use client';

import { useTheme } from 'next-themes';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { type ComponentProps, useEffect, useState } from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = ComponentProps<typeof Sonner>;

const toastBase =
  'group toast relative flex w-full items-start gap-3 rounded-xl border border-border/80 bg-card/95 px-4 py-3 pr-10 text-foreground shadow-md backdrop-blur-md sm:max-w-[22rem]';

const typeAccent = {
  success: 'border-l-[3px] border-l-emerald-600/75 dark:border-l-emerald-400/65',
  error: 'border-l-[3px] border-l-destructive',
  warning: 'border-l-[3px] border-l-amber-600/80 dark:border-l-amber-400/70',
  info: 'border-l-[3px] border-l-primary/70',
};

export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-center"
      offset={20}
      gap={12}
      duration={3800}
      closeButton
      icons={{
        success: (
          <CheckCircle2
            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
            strokeWidth={2}
          />
        ),
        info: <Info className="text-primary size-4 shrink-0" aria-hidden strokeWidth={2} />,
        warning: (
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden strokeWidth={2} />
        ),
        error: <AlertCircle className="text-destructive size-4 shrink-0" aria-hidden strokeWidth={2} />,
      }}
      toastOptions={{
        classNames: {
          toast: toastBase,
          title: 'text-sm font-medium leading-snug text-foreground',
          description: 'text-muted-foreground mt-0.5 text-xs leading-relaxed',
          success: typeAccent.success,
          error: typeAccent.error,
          warning: typeAccent.warning,
          info: typeAccent.info,
          closeButton:
            'absolute right-1.5 top-1.5 flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground opacity-50 transition-opacity hover:bg-muted/60 hover:opacity-100',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium',
          cancelButton:
            'text-muted-foreground hover:bg-muted/80 inline-flex h-8 items-center justify-center rounded-md border border-border/80 bg-transparent px-3 text-xs font-medium',
        },
      }}
      {...props}
    />
  );
}
