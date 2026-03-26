import Image from 'next/image';
import { Youtube, Github, Tv, Mail, Smartphone, Joystick, Guitar, Motorbike, ShipWheel } from 'lucide-react';
import { SOCIAL_LINKS } from '@/app/constants';

export function AboutPageContent() {
  return (
    <article className="site-page">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">关于</h1>
      </header>

      <section className="mb-6">
        <div className="flex items-center gap-4">
          <Image className="rounded-full" src="/avatar1.jpg" alt="Ethan Park" width={72} height={72} />
          <div>
            <p className="text-lg font-semibold">白玩dev</p>
            <p className="text-sm text-foreground/75">软件开发工程师</p>
          </div>
        </div>
      </section>

      <section className="site-prose prose prose-neutral dark:prose-invert mb-6">
        <p>我是一个软件开发工程师，喜欢研究各种技术，喜欢分享自己的经验和心得。</p>
        <p className="flex flex-wrap items-center gap-x-1">
          同时我也是个 <Joystick className="mx-0.5 size-4" />
          主机游戏玩家 <ShipWheel className="mx-0.5 size-4" />
          佛学爱好者 <Motorbike className="mx-0.5 size-4" />
          摩托佬 <Guitar className="mx-0.5 size-4" />
          业余吉他手。
        </p>
      </section>

      <hr className="site-hr" />

      <section>
        <h2 className="mb-3 text-lg font-semibold">联系方式</h2>
        <ul className="m-0 list-none p-0 space-y-2">
          <li>
            <a target="_blank" href={SOCIAL_LINKS.bilibili} rel="noopener noreferrer">
              <span className="inline-flex items-center gap-2">
                <Tv className="size-4" />
                Bilibili
              </span>
            </a>
          </li>
          <li>
            <a target="_blank" href={SOCIAL_LINKS.youtube} rel="noopener noreferrer">
              <span className="inline-flex items-center gap-2">
                <Youtube className="size-4" />
                YouTube
              </span>
            </a>
          </li>
          <li>
            <a target="_blank" href={SOCIAL_LINKS.github} rel="noopener noreferrer">
              <span className="inline-flex items-center gap-2">
                <Github className="size-4" />
                GitHub
              </span>
            </a>
          </li>
          <li>
            <a target="_blank" href={SOCIAL_LINKS.email} rel="noopener noreferrer">
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4" />
                Email
              </span>
            </a>
          </li>
          <li className="pt-2">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="m-0">个人微信：WhitePlay2233</p>
                <p className="mt-1 text-sm text-foreground/75">扫码关注公众号第一时间获取最新文章</p>
                <Image src="/wxqr.jpg" alt="微信公众号二维码" width={150} height={150} className="mt-2 rounded border" />
              </div>
            </div>
          </li>
        </ul>
      </section>
    </article>
  );
}
