import type { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Me",
  description: "Me",
};

export default function MePage() {
  return (
    <article>
      <div className="flex items-center gap-2 mb-4">
        <Image
          className="rounded-full"
          src="/avatar1.jpg"
          alt="Ethan Park"
          width={32}
          height={32}
        />
        <span className="text-xl sm:text-2xl font-bold  cursor-pointer hover:text-blue-600 transition-colors">
          Ethan Park
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        我是一个软件开发工程师，喜欢研究各种技术，喜欢分享自己的经验和心得。
        <br />
        同时我也是个主机游戏玩家/佛学爱好者/摩托佬/业余吉他手
        <br />
      </p>
      <ul className="list-none cursor-pointer text-gray-600 text-sm">
        <li>
          <a target="_blank" href="https://github.com/WhiteP1ay">
            💻 GitHub
          </a>
        </li>
        <li>
          <a target="_blank" href="https://space.bilibili.com/107889531">
            📺 Bilibili
          </a>
        </li>
        <li>
          <a target="_blank" href="mailto:EthanPark2233@gmail.com">
            📧 Email
          </a>
        </li>
        <li>
          扫码关注公众号第一时间获取最新文章
          <Image src="/wxqr.jpg" alt="Wechat" width={100} height={100} />
        </li>
      </ul>
    </article>
  );
}
