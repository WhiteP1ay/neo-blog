'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { Toaster } from '@/app/components/ui/sonner';

/** Toast 通知类型（与历史 API 一致） */
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * 根布局挂载：渲染 Sonner + 提供 showToast（内部转发到 sonner）。
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        sonnerToast.success(message);
        break;
      case 'error':
        sonnerToast.error(message);
        break;
      case 'warning':
        sonnerToast.warning(message);
        break;
      default:
        sonnerToast.message(message);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
