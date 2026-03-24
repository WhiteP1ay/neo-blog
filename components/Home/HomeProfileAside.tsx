import Image from 'next/image';
import Link from 'next/link';
import { Github, Mail, Tv, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const socialClass = 'text-muted-foreground hover:text-primary inline-flex items-center gap-2 text-sm transition-colors';

/**
 * 首页右侧：个人简介与常用外链（与关于页信息一致、更紧凑）
 */
export function HomeProfileAside() {
  return (
    <Card className="border-border shadow-sm lg:sticky lg:top-24">
      <CardHeader className="text-center sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Image
            src="/avatar1.jpg"
            alt="白玩dev"
            width={72}
            height={72}
            className="size-[72px] rounded-full border border-border object-cover"
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <CardTitle className="text-xl">白玩dev</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">软件开发工程师</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          喜欢折腾技术与分享心得。更多介绍与联系方式见关于页；工具与咨询请访问工具页。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/about">关于我</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools">工具与咨询</Link>
          </Button>
        </div>
        <Separator />
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">链接</p>
          <ul className="flex flex-col gap-2">
            <li>
              <a
                href="https://space.bilibili.com/107889531"
                target="_blank"
                rel="noopener noreferrer"
                className={socialClass}
              >
                <Tv className="size-4 shrink-0" />
                Bilibili
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@whiteplay-dev"
                target="_blank"
                rel="noopener noreferrer"
                className={socialClass}
              >
                <Youtube className="size-4 shrink-0" />
                YouTube
              </a>
            </li>
            <li>
              <a href="https://github.com/WhiteP1ay" target="_blank" rel="noopener noreferrer" className={socialClass}>
                <Github className="size-4 shrink-0" />
                GitHub
              </a>
            </li>
            <li>
              <a href="mailto:EthanPark2233@gmail.com" className={socialClass}>
                <Mail className="size-4 shrink-0" />
                Email
              </a>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
