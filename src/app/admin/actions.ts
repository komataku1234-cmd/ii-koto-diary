"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function deletePost(formData: FormData) {
  // このActionはURLを直接叩けば呼び出せてしまうため、
  // 管理画面のフォーム経由だからといって認証済みとは限らない。念のためここでも確認する。
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
