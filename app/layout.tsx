import './global.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const viewport: Viewport = {
  themeColor: '#f0eee4',
};

export const metadata: Metadata = {
  title: 'White Meta',
  description: '白玩dev 的个人网站',
  keywords: ['博客', '技术文章', '编程'],
  authors: [{ name: '白玩dev' }],
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'White Meta',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9738834480743987"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
