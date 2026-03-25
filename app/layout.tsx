import type { Metadata } from 'next';
import './global.css';
import { AboutPageContent } from '@/app/(site)/about/AboutPageContent';
import { PrivacyPageContent } from '@/app/(site)/privacy/PrivacyPageContent';
import { SitePageModalsProvider } from '@/components/SitePageModals';
import { ToastProvider } from '@/components/Toast';
import { ToolsPageContent } from '@/app/(site)/tools/ToolsPageContent';
import { ThemeProvider } from '@/components/ThemeProvider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'White Meta',
    template: '%s | White Meta',
  },
  description: 'White Meta is a blog for whitePlay',
  keywords: ['blog', '技术博客', '编程'],
  authors: [{ name: 'whitePlay' }],
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
        <ThemeProvider>
          <ToastProvider>
            <SitePageModalsProvider
              aboutSlot={<AboutPageContent />}
              privacySlot={<PrivacyPageContent />}
              toolsSlot={<ToolsPageContent variant="modal" />}
            >
              {children}
            </SitePageModalsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
