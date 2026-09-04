import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ひとこと日記",
  description: "今日あったちょっといいことを匿名で共有する日記アプリ",
};

export default function RootLayout({
  children,
  header,
  footer,
}: Readonly<{
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col">
        {header}
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          {children}
        </main>
        {footer}
      </body>
    </html>
  );
}
