"use client"; // error.tsxはReactのError Boundaryとして動くため、Client Componentである必要がある

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // console.errorはこのエラーを体験した本人のブラウザのコンソールにしか残らず、
    // サーバーやこのアプリを監視しているサービスには送られない。
    // (現状このアプリにはエラー監視サービスの連携が無いため、あくまで
    // 開発者がdevtoolsを開いて自分で再現させたときの手がかり用)
    console.error(error);
  }, [error]);

  // Server Action内でthrowしたError(文字数制限などのバリデーションエラーや、
  // 管理者権限チェックの失敗)はメッセージがそのままクライアントに渡ってくるため
  // ここで表示できる。一方、DB接続エラーなど本当に想定外の例外だとmessageが
  // 無い/空のこともあるため、その場合はdigest(無ければ汎用文言)を代わりに出す。
  const detail = error.message || (error.digest ? `参照ID: ${error.digest}` : "詳細不明のエラーです。");

  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 className="text-base font-semibold">問題が発生しました</h2>
      <p className="text-sm text-slate-500">
        操作を完了できませんでした。内容をご確認のうえ、もう一度お試しください。
      </p>
      <div className="flex flex-col gap-1 rounded-md bg-slate-50 px-3 py-2">
        <span className="text-xs text-slate-400">エラー内容</span>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* unstable_retry → このエラーが発生した部分(セグメント)をサーバーから
            再取得・再描画する。ページの先頭にある認証チェック等のredirectも
            もう一度実行されるため、管理画面でセッション切れが起きた場合はここで
            ログイン画面へ導かれる */}
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          もう一度試す
        </button>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← タイムラインに戻る
        </Link>
      </div>
    </div>
  );
}
