import type { SiteLocale } from '@/lib/site-locale';

type AboutPageContentProps = {
  locale: SiteLocale;
};

/**
 * 站点简介（前台 / 管理端复用）；中英文分文案。
 */
export function AboutPageContent({ locale }: AboutPageContentProps) {
  if (locale === 'en') {
    return (
      <section className="retro-content space-y-2 text-sm">
        <h2 className="text-base font-semibold">About this site</h2>
        <p>White Meta is the personal site of whitePlay (白玩dev).</p>
      </section>
    );
  }

  return (
    <section className="retro-content space-y-2 text-sm">
      <h2 className="text-base font-semibold">关于本站</h2>
      <p>White Meta 是白玩的个人网站</p>
    </section>
  );
}
