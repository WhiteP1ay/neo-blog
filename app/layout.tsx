import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  title: {
    default: "White Meta",
    template: "%s | White Meta",
  },
  description: "White Meta is a blog for whitePlay",
  keywords: ["blog", "技术博客", "编程"],
  authors: [{ name: "whitePlay" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "White Meta",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
