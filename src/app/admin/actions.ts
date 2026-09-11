"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

const MAX_CONTENT_LENGTH = 140;
const MAX_NICKNAME_LENGTH = 20;

async function deletePost(formData: FormData) {
  // admin/page.tsxのisAdminAuthenticatedチェックは「ページを描画するとき」にしか働かない。
  // Server Actionは/adminの画面を一度も表示せず、devtoolsのNetworkタブ等で見た
  // リクエストの形を真似て直接POSTするだけでも実行できてしまうため、
  // ページ側のガードを素通りされる。呼び出し元に関わらず弾けるよう、
  // この関数自身の中でも認証を確認する(多層防御)。
  // ページ(admin/page.tsx等)側はredirectでログイン画面に案内するが、
  // ここ(Server Action)ではthrowで拒否する:未認証でのページアクセスは
  // 画面遷移として普通に起こりうるのでredirectが自然だが、Server Actionは
  // 正規のUIなら認証済み画面の中にしかボタン/フォームが無いはずで、
  // 未認証で呼ばれるのは画面を経由しない直接操作(curl等)がほとんど。
  // その異常な操作をredirectでスムーズに流さず、拒否として明確にthrowしている。
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

async function updatePost(formData: FormData) {
  // deletePostと同じ理由(直接POSTされうるため多層防御、throwで拒否する理由もdeletePostのコメント参照)
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
  if (content.trim().length > MAX_CONTENT_LENGTH) {
    // post/actions.tsのcreatePostと同じ理由(devtools等での改ざん・直接POST対策)
    throw new Error(`本文は${MAX_CONTENT_LENGTH}文字以内で入力してください。`);
  }
  if (
    typeof nickname === "string" &&
    nickname.trim().length > MAX_NICKNAME_LENGTH
  ) {
    // nicknameも同じ理由(devtools等でmaxLength属性を外して回避されうる)でサーバー側でも検証する
    throw new Error(
      `ニックネームは${MAX_NICKNAME_LENGTH}文字以内で入力してください。`,
    );
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      content: content.trim(),
      // UPDATEには@defaultが効かない(新規作成時のみ有効)ため、
      // 空欄ならキーを省略するのではなく明示的に既定値と同じ文字列を書く
      nickname:
        typeof nickname === "string" && nickname.trim() !== ""
          ? nickname.trim()
          : "名無しさん",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

async function restorePost(formData: FormData) {
  // deletePostと同じ理由(直接POSTされうるため多層防御、throwで拒否する理由もdeletePostのコメント参照)
  if (!(await isAdminAuthenticated())) {
    throw new Error("権限がありません。");
  }

  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId)) {
    throw new Error("不正なリクエストです。");
  }

  // deletedAtをnullに戻すだけ。物理削除していない(ソフトデリート)ので、
  // 誤って削除しても元通りに復元できる
  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: null },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteReply(formData: FormData) {
  // deletePost/updatePostと同じ理由(直接POSTされうるため多層防御、throwで拒否する理由もdeletePostのコメント参照)
  if (!(await isAdminAuthenticated())) {
    throw new Error("権限がありません。");
  }

  const replyId = Number(formData.get("replyId"));
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(replyId) || !Number.isInteger(postId)) {
    throw new Error("不正なリクエストです。");
  }

  // 物理削除ではなくソフトデリート(deletedAtを立てるだけ)
  await prisma.reply.update({
    where: { id: replyId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/admin/posts/${postId}/edit`);
  revalidatePath("/");
}

export { deletePost, updatePost, deleteReply, restorePost };
