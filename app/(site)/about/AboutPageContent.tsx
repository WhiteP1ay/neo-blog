import type { SiteLocale } from '@/lib/site-locale';

type AboutPageContentProps = {
  locale: SiteLocale;
};

/** 文件放在仓库 `public/wxqr.jpg`，须用根绝对路径，避免在 `/en/about` 等子路径下被解析成 `/en/wxqr.jpg`。 */
const WX_QR_SRC = '/wxqr.jpg';

function WxPublicAccountQr({ alt }: { alt: string }) {
  return (
    <>
      {/* biome-ignore lint/performance/noImgElement: public 静态二维码直链 /wxqr.jpg，避免 next/image 优化在部分环境失败 */}
      <img
        src={WX_QR_SRC}
        alt={alt}
        width={220}
        height={220}
        decoding="async"
        className="h-auto max-w-[220px] rounded border border-border bg-background"
      />
    </>
  );
}

/**
 * 站点简介（前台 / 管理端复用）；中英文分文案。
 */
export function AboutPageContent({ locale }: AboutPageContentProps) {
  if (locale === 'en') {
    return (
      <section className="space-y-8 text-sm">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">About this site</h2>
          <p>
            White Meta is the personal site of whitePlay (白玩dev)
          </p>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <h3 className="text-base font-semibold">WeChat official account</h3>
          <div className="flex flex-col gap-2">
            <WxPublicAccountQr alt="WeChat public account QR code — scan to follow" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 text-sm">
      <div className="space-y-3">
        <h2 className="text-base font-semibold">关于本站</h2>
        <p>
          White Meta 是白玩（whitePlay）的个人站点，
        </p>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-base font-semibold">微信公众号</h3>
        <p>关注公众号第一时间获取更新动态</p>
        <div className="flex flex-col gap-2">
          <WxPublicAccountQr alt="微信公众号二维码，使用微信扫一扫关注" />
        </div>
      </div>
    </section>
  );
}
