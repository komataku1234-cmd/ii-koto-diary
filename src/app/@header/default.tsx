export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-1 px-4 py-4">
        <h1 className="text-lg font-bold">ひとこと日記</h1>
        <p className="text-sm text-slate-500">
          今日あったちょっといいことを、匿名でひとことシェア
        </p>
      </div>
    </header>
  );
}
