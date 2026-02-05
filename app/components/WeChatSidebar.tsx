import Image from "next/image";

/**
 * 微信公众号侧边栏组件（Sticky）
 */
export function WeChatSidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-16">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <p className="text-sm text-gray-600 mb-4">
              关注公众号，第一时间获取最新文章。
            </p>
            <Image
              src="/wxqr.jpg"
              alt="微信公众号二维码"
              width={150}
              height={150}
              className="rounded-lg border border-gray-200"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

