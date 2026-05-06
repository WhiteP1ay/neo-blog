import { ThemeSwitcher } from '@/components/ThemeSwitcher';

type SiteThemeSwitcherProps = {
  className?: string;
};

/**
 * 旧版 (site) 专用：复古极简风的主题切换。
 * - 用纯文本链接呈现，不依赖 dropdown/menu 等重 UI。
 */
export function SiteThemeSwitcher({ className }: SiteThemeSwitcherProps) {
  return <ThemeSwitcher className={className} />;
}

