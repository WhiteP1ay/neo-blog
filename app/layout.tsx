import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "White Meta",
  description: "White Meta is a blog for whitePlay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
