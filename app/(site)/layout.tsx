import type { ReactNode } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

function SiteHeader() {
  return (
    <header className="bg-slate-900 py-8">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-white hover:text-slate-200"
        >
          White Meta
        </Link>
        <p className="mt-1 text-sm text-slate-300">
          白玩dev 的个人网站
        </p>
        <SiteNav />
      </div>
    </header>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
