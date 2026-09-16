import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { updatePost, deleteReply, restoreReply } from "../../../actions";
import { MAX_CONTENT_LENGTH, MAX_NICKNAME_LENGTH } from "@/lib/constants";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) {
    notFound();
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    notFound();
  }

  // 管理者はこの投稿に付いているコメントの削除・復元もここで行えるようにする。
  // 復元先が無いと復元できないため、削除済みのコメントも含めて取得する
  const replies = await prisma.reply.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-base font-semibold">投稿を編集</h2>

      <form action={updatePost} className="flex flex-col gap-4">
        <input type="hidden" name="postId" value={post.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor="nickname" className="text-sm font-medium">
            ニックネーム(任意)
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            maxLength={MAX_NICKNAME_LENGTH}
            defaultValue={post.nickname}
            placeholder="名無しさん"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="content" className="text-sm font-medium">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            required
            maxLength={MAX_CONTENT_LENGTH}
            rows={4}
            defaultValue={post.content}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {/* cursor-pointer → buttonはaタグと違いデフォルトではポインターにならない(cursor:default)ため、明示的に指定する */}
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          保存する
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">コメント</h3>
        {replies.length === 0 ? (
          <p className="text-sm text-slate-500">コメントはありません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {replies.map((reply) => (
              // items-start → コメント本文が長くて複数行になったとき、右の削除ボタンが
              // 上下中央(デフォルト)ではなく上端に揃うようにする。画面上は変わんないけどformとボタンの高さを揃えてる。
              <li
                key={reply.id}
                className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-600">
                    {reply.nickname}
                  </span>
                  <span className="ml-2 text-slate-500">{reply.content}</span>
                  {reply.deletedAt && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                      削除済み
                    </span>
                  )}
                </div>
                {/* shrink-0 → 左のコメント本文がどれだけ長くても、削除・復元ボタン側は潰れて小さくならない */}
                {reply.deletedAt ? (
                  // restorePostと同じ理由(ソフトデリートなので誤って削除しても復元できる)
                  <form action={restoreReply} className="shrink-0">
                    <input type="hidden" name="replyId" value={reply.id} />
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      復元
                    </button>
                  </form>
                ) : (
                  <form action={deleteReply} className="shrink-0">
                    <input type="hidden" name="replyId" value={reply.id} />
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      削除
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/admin" className="text-sm text-slate-500 hover:underline">
        ← 管理者画面に戻る
      </Link>
    </div>
  );
}
