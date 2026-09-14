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
    //passive:true → すぐこの処理を始めるけどこの処理を待たなくて良くなる
    //promiseとの違いは、JSの処理が終わるのを待たずにスクロールが進むため、スクロールがカクつかない
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
       // top: 0, behavior: "smooth" }: スクロール位置を0にして、スムーズにスクロールする
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="ページの先頭に戻る"
      // fixed → スクロールしても画面上の同じ位置に留まり続ける
      // items-center: 箱の中の高さ方向の中央に寄せる
      // justify-center: 箱の中の幅方向の中央に寄せる
      // z-50: 画面上の他の要素よりも前面に出すための優先度(数が大きい方)を指定する。このコードではここしか設定してないためこれが一番上。
      //shadow-lg: 見た目変わってないようにしか見えないから不採用
      className="fixed right-6 bottom-6 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white"
    >
      ↑
    </button>
  );
}
