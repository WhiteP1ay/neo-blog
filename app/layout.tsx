import './global.css';
import './(site)/retro.css';
import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import Script from 'next/script';

export const viewport: Viewport = {
  themeColor: '#353535',
};

export const metadata: Metadata = {
  title: {
    default: 'White Meta',
    template: '%s | White Meta',
  },
  description: 'White Meta is a blog for whitePlay',
  keywords: ['blog', '技术博客', '编程'],
  authors: [{ name: 'whitePlay' }],
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'White Meta',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'White Meta',
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9738834480743987"
            crossOrigin="anonymous"
          ></Script>
        )}
      </head>
      <body>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
          disableTransitionOnChange
        >
          <ToastProvider>{children}</ToastProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
