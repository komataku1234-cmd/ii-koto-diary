"use client"; // スクロール位置の監視とonClickはブラウザでしか動かないため

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 300; // これ未満のスクロール量ではボタンを出さない(最初から出ていると邪魔なため)

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll(); // 読み込み直後、すでにスクロール済みの状態で開かれた場合にも対応する
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="ページの先頭に戻る"
      // fixed → スクロールしても画面上の同じ位置に留まり続ける(通常のボタンと違い、
      // コンテンツの上に浮かぶ表示になるためshadowで区別を付けている)
      className="fixed right-6 bottom-6 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-lg"
    >
      ↑
    </button>
  );
}
