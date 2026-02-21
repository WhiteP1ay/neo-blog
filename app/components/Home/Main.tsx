import { TypewriterText } from "./TypewriterText";
import { Button } from "@/app/components/ui/Button";
import Link  from "next/link";

export function Main() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-8 tracking-tight">
          <TypewriterText />
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-16 max-w-xl mx-auto leading-relaxed">
          <Link href="/about" className="text-gray-500 dark:text-gray-300 hover:underline">白玩dev</Link>的个人网站
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            variant="outline"
            size="lg"
            isLink
            href="/blog"
          >
            浏览博客
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              const toolsSection = document.getElementById('tools');
              if (toolsSection) {
                toolsSection.scrollIntoView({
                  behavior: 'smooth'
                });
              }
            }}
          >
            探索更多...
          </Button>
        </div>
      </div>

    </main>
  )
}