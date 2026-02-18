import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const isLocal = process.env.NEXT_PUBLIC_APP_ENV === "local";

export const metadata: Metadata = {
  title: isLocal ? "[DEV] MyTube" : "MyTube - YouTube + AI 요약",
  description: "유튜브 영상을 AI로 한국어 요약하세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyTube",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${GeistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
