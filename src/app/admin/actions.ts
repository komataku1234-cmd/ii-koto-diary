"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function deletePost(formData: FormData) {
  // admin/page.tsxのisAdminAuthenticatedチェックは「ページを描画するとき」にしか働かない。
  // Server Actionは/adminの画面を一度も表示せず、devtoolsのNetworkタブ等で見た
  // リクエストの形を真似て直接POSTするだけでも実行できてしまうため、
  // ページ側のガードを素通りされる。呼び出し元に関わらず弾けるよう、
  // この関数自身の中でも認証を確認する(多層防御)。
  if (!(await isAdminAuthenticated())) {
    throw new Error("権限がありません。");
  }

  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId)) {
    throw new Error("不正なリクエストです。");
  }

  // 物理削除ではなくソフトデリート(deletedAtを立てるだけ)
  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updatePost(formData: FormData) {
  // deletePostと同じ理由(直接POSTされうる)で、ここでも改めて認証を確認する
  if (!(await isAdminAuthenticated())) {
    throw new Error("権限がありません。");
  }

  const postId = Number(formData.get("postId"));
  const nickname = formData.get("nickname");
  const content = formData.get("content");

  if (!Number.isInteger(postId)) {
    throw new Error("不正なリクエストです。");
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("本文を入力してください。");
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      content: content.trim(),
      nickname:
        typeof nickname === "string" && nickname.trim() !== ""
          ? nickname.trim()
          : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}
