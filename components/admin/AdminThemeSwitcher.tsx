import { ThemeSwitcher } from '@/components/ThemeSwitcher';

/**
 * Admin 顶部主题切换：
 * - 支持 light / dark / system 三态
 * - 挂载前占位，避免 hydration mismatch
 */
export function AdminThemeSwitcher() {
  return <ThemeSwitcher />;
}
