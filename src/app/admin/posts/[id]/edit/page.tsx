import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { updatePost, deleteReply } from "../../../actions";

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

  // 管理者はこの投稿に付いているコメントの削除もここで行えるようにする
  const replies = await prisma.reply.findMany({
    where: { postId, deletedAt: null },
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
            maxLength={20}
            defaultValue={post.nickname ?? ""}
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
            maxLength={140}
            rows={4}
            defaultValue={post.content}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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
              <li
                key={reply.id}
                className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-600">
                    {reply.nickname || "名無しさん"}
                  </span>
                  <span className="ml-2 text-slate-500">{reply.content}</span>
                </div>
                <form action={deleteReply} className="shrink-0">
                  <input type="hidden" name="replyId" value={reply.id} />
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </form>
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
