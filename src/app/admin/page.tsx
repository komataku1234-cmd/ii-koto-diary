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
  timeZone: "Asia/Tokyo", // サーバー(コンテナ)のタイムゾーンがUTCなので、表示だけ日本時間に変換する
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
      {/* justify-between:両端に子要素を寄せて、余った隙間を要素の間だけに均等配置 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">管理者画面 - 投稿一覧</h2>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← タイムラインに戻る
        </Link>
      </div>
      {/* overflow-x-auto:横方向のはみ出しをスクロールバーで対応 今回でないように修正をかけたから多分出ることない*/}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {/* table-fixed → table-layout:fixedにする。デフォルト(auto)は中身の最大幅を基準に
            列幅を決めるため、truncateを付けても表全体がはみ出してスクロールバーが出てしまう。
            fixedならこのthに書いた幅(w-*)で列幅が固定され、本文列だけ幅指定を省略して
            残りの余白を全部本文に回している */}
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2">ID</th>
              <th className="w-24 whitespace-nowrap px-3 py-2">ニックネーム</th>
              <th className="px-3 py-2">本文</th>
              <th className="w-30 px-3 py-2">投稿日時</th>
              <th className="w-20 px-3 py-2">状態</th>
              <th className="w-36 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              // last:border-0 → 一番最後の行だけ下線(border-b)を消す。CSSの:last-childに相当するTailwindの記法
              <tr key={post.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 text-slate-500">{post.id}</td>
                {/* table-fixedで幅はw-24に固定済みなので、本文と同じくtruncateだけで
                    省略表示できる(max-w指定は不要) */}
                <td className="truncate px-3 py-2">{post.nickname}</td>
                {/* table-fixedにしたことでこの列の幅は「他の列の残り全部」になっているので、
                    max-w-xsは不要。truncateだけでその幅からはみ出た分を...で省略できる */}
                <td className="truncate px-3 py-2">{post.content}</td>
                {/* whitespace-nowrap:改行せずに1行で表示する。*/}
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                  {dateFormatter.format(post.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
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
                      {/* contents → このform自体は箱(レイアウト上の存在)を持たず、
                          中のbuttonだけが親のflexに直接並んでいるかのように扱われる。
                          これが無いと、隣の編集Linkとボタンの大きさが揃わない */}
                      <form action={deletePost} className="contents">
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
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
