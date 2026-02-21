import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { Youtube, Github, Tv, Mail, Smartphone, Joystick, Guitar, Motorbike, ShipWheel } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "About White Meta",
};

export default function MePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <Breadcrumb />
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <Image
              className="rounded-full"
              src="/avatar1.jpg"
              alt="Ethan Park"
              width={80}
              height={80}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                白玩dev
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">软件开发工程师</p>
            </div>
          </div>

          <div className="prose prose-sm sm:prose-lg max-w-none text-gray-700 dark:text-gray-300 mb-6">
            <p className="mb-4">
              我是一个软件开发工程师，喜欢研究各种技术，喜欢分享自己的经验和心得。
            </p>
            <p className="mb-4 flex">
              同时我也是个<Joystick className="mx-1" />主机游戏玩家<ShipWheel className="mx-1" />佛学爱好者<Motorbike className="mx-1" />摩托佬<Guitar className="mx-1" />业余吉他手。
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">联系方式</h2>
            <ul className="space-y-3">
              <li>
                <a
                  target="_blank"
                  href="https://space.bilibili.com/107889531"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Tv />
                  <span>Bilibili</span>
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  href="https://www.youtube.com/@whiteplay-dev"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Youtube />
                  <span>YouTube</span>
                </a>
              </li>

              <li>
                <a
                  target="_blank"
                  href="https://github.com/WhiteP1ay"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Github />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  href="mailto:EthanPark2233@gmail.com"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Mail />
                  <span>Email</span>
                </a>
              </li>
              <li className="pt-2">
                <div className="flex items-start gap-3">
                  <Smartphone />
                  <div>
                    <p className="dark:text-gray-300">个人微信：WhitePlay2233</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">扫码关注公众号第一时间获取最新文章</p>
                    <Image
                      src="/wxqr.jpg"
                      alt="微信公众号二维码"
                      width={150}
                      height={150}
                      className="rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
