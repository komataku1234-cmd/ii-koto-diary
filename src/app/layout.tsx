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
    // enにすると読み上げソフトとかに影響が出る
    <html lang="ja">
      {/* min-h-screen(画面の高さ分は最低確保)+ flex-col(縦並び)+
          mainだけflex-1(残りの余白を全部埋める)の組み合わせで、
          コンテンツが少ないページでもfooterが画面下に張り付く(沈み込まない)ようにしている */}
      <body className="flex min-h-screen flex-col">
        {header}
        
        {/* w-full → 幅100%(親要素いっぱいに広がろうとする)
            max-w-2xl → 幅の上限を42rem(672px)に制限する。w-fullで広がろうとしても、これ以上は広がれない
            mx-auto → 左右の余白(margin)を自動調整し、中央に寄せる
            この3つの組み合わせで「中央寄せ・幅672px上限のコンテンツ列」になる */}
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          {children}
        </main>
        {footer}
      </body>
    </html>
  );
}
