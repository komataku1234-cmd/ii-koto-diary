import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { deletePost } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminPage() {
  // 未認証なら一覧を取得する前にログイン画面へ飛ばす
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  // 管理画面は削除済みも含めて検索・確認できる必要があるため、deletedAtで絞り込まず全件取得する
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">管理者画面 - 投稿一覧</h2>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← タイムラインに戻る
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">ニックネーム</th>
              <th className="px-3 py-2">本文</th>
              <th className="px-3 py-2">投稿日時</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 text-slate-500">{post.id}</td>
                <td className="px-3 py-2">{post.nickname || "名無しさん"}</td>
                <td className="px-3 py-2">{post.content}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                  {dateFormatter.format(post.createdAt)}
                </td>
                <td className="px-3 py-2">
                  {post.deletedAt ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                      削除済み
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                      公開中
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {!post.deletedAt && (
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        編集
                      </Link>
                      <form action={deletePost}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          削除
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
