import Image from 'next/image';
import { SOCIAL_LINKS } from '@/app/constants';

export function AboutPageContent() {
  return (
    <article className="site-page">
      <h1 className="text-2xl font-semibold tracking-tight">关于</h1>

      <section className="mb-6">
        <Image className="mb-3 rounded-full" src="/avatar1.jpg" alt="Ethan Park" width={64} height={64} />
        <p className="text-base font-semibold">白玩dev</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">联系方式</h2>
        <ul className="m-0 list-disc pl-5 space-y-1">
          <li>
            <a target="_blank" href={SOCIAL_LINKS.bilibili} rel="noopener noreferrer">
              Bilibili
            </a>
          </li>
          <li>
            <a target="_blank" href={SOCIAL_LINKS.youtube} rel="noopener noreferrer">
              YouTube
            </a>
          </li>
          <li>
            <a target="_blank" href={SOCIAL_LINKS.github} rel="noopener noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a target="_blank" href={SOCIAL_LINKS.email} rel="noopener noreferrer">
              Email
            </a>
          </li>
          <li>个人微信：WhitePlay2233</li>
        </ul>
        <p className="mt-3 text-sm text-foreground/75">扫码关注公众号第一时间获取最新文章：</p>
        <Image src="/wxqr.jpg" alt="微信公众号二维码" width={150} height={150} className="mt-2 border" />
      </section>
    </article>
  );
}
