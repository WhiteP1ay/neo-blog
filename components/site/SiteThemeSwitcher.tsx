import { ThemeSwitcher } from '@/components/ThemeSwitcher';

type SiteThemeSwitcherProps = {
  className?: string;
};

/**
 * 前台站点：Light / Dark / System 三态切换（纯按钮组，无下拉）。
 */
export function SiteThemeSwitcher({ className }: SiteThemeSwitcherProps) {
  return <ThemeSwitcher className={className} />;
}

