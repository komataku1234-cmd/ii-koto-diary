import Link from "next/link";
import { createPost } from "./actions";

export default function PostPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">投稿する</h2>
      <p className="text-xs text-slate-500">
        深刻な相談や自傷などの内容の投稿はご遠慮ください。
      </p>

      {/* actionにServer Action関数を直接渡すと、JS無効時でも通常のフォーム送信として動作する(プログレッシブエンハンスメント) */}
      <form action={createPost} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nickname" className="text-sm font-medium">
            ニックネーム(任意)
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            maxLength={20}
            placeholder="名無しさん"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="content" className="text-sm font-medium">
            今日あったちょっといいこと
          </label>
          {/* required/maxLengthはあくまでブラウザ側の補助的なチェック。
              actions.tsのcreatePost側で同じ内容をサーバーでも検証している */}
          <textarea
            id="content"
            name="content"
            required
            maxLength={140}
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          投稿する
        </button>
      </form>

      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← タイムラインに戻る
      </Link>
    </div>
  );
}
