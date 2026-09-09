import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4 text-sm text-slate-500">
        <p>&copy; 2026 ひとこと日記</p>
        <Link href="/admin" className="hover:text-slate-700 hover:underline">
          管理者ログイン
        </Link>
      </div>
    </footer>
  );
}
