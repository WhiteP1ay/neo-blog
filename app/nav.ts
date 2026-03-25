/** 在站内以弹窗打开，href 仍保留供爬虫、新标签页与移动端整页浏览 */
export type SiteModalId = 'tools' | 'about' | 'privacy';

export const navItems: Array<{ href: string; label: string; modal?: SiteModalId }> = [
  { href: '/blog', label: '博客' },
  { href: '/tools', label: '工具', modal: 'tools' },
  { href: '/about', label: '关于', modal: 'about' },
  { href: '/privacy', label: '隐私政策', modal: 'privacy' },
];
