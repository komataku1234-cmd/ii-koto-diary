import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { updatePost } from "../../../actions";

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

      <Link href="/admin" className="text-sm text-slate-500 hover:underline">
        ← 管理者画面に戻る
      </Link>
    </div>
  );
}
