import { prisma } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminPage() {
  // 管理画面は削除済みも含めて検索・確認できる必要があるため、deletedAtで絞り込まず全件取得する
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">管理者画面 - 投稿一覧</h2>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">ニックネーム</th>
              <th className="px-3 py-2">本文</th>
              <th className="px-3 py-2">投稿日時</th>
              <th className="px-3 py-2">状態</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
