"use client"; // error.tsxと同じくError Boundaryなので必須

import "./globals.css"; // global-errorはルートレイアウトごと差し替わるため、スタイルも自前で読み込む必要がある

// error.tsxはlayout.tsx(ヘッダー/フッターを含む)の中身だけを差し替えるが、
// layout.tsx自体が投げた例外はerror.tsxでは捕まえられない。その最後の砦として、
// html/bodyタグごと自前で用意するのがglobal-error.tsx(発生頻度は低い想定)。
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div
          role="alert"
          className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
        >
          <h2 className="text-base font-semibold">問題が発生しました</h2>
          <p className="text-sm text-slate-500">
            アプリの表示中に問題が発生しました。お手数ですが、時間をおいて再度アクセスしてください。
          </p>
          {(error.message || error.digest) && (
            <div className="flex flex-col gap-1 rounded-md bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-400">エラー内容</span>
              <p className="text-sm text-slate-500">
                {error.message || `参照ID: ${error.digest}`}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="cursor-pointer self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  );
}
