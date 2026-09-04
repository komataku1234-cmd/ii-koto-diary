import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold">ひとこと日記</h1>
          <p className="text-sm text-slate-500">
            今日あったちょっといいことを、匿名でひとことシェア
          </p>
        </div>
        <Link
          href="/post"
          className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          投稿する
        </Link>
      </div>
    </header>
  );
}
