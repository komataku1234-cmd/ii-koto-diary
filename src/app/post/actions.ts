"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_CONTENT_LENGTH = 140;

export async function createPost(formData: FormData) {
  // formData.get()の型はFormDataEntryValue(=string|File)|null。
  // <input type="file">用にFileの可能性も型として含まれるため、
  // 「このフォームにfile欄は無い」という前提だけでは絞り込めない。
  const nickname = formData.get("nickname");
  const content = formData.get("content");

  // Server Actionは1つのHTTPエンドポイントとして公開されるため、
  // このpage.tsxのフォーム以外(改ざんされたリクエスト等)から
  // 直接呼ばれる可能性もある。string以外(File/フィールド無し=null)は
  // ここで弾いて、以降は安全にstring用メソッドを使えるようにする。
  if (typeof content !== "string" || content.trim().length === 0) {
    // trim()で前後の空白を除いてから長さを見ることで、
    // 空白だけの投稿(見た目は空欄なのにlengthは0じゃない)も弾ける。
    throw new Error("本文を入力してください。");
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    // textarea側のmaxLengthはブラウザ側の制限に過ぎず、
    // devtoolsで外したり直接リクエストを送れば回避できるため、
    // サーバー側でも同じ上限を必ずチェックする。
    throw new Error(`本文は${MAX_CONTENT_LENGTH}文字以内で入力してください。`);
  }

  await prisma.post.create({
    data: {
      content: content.trim(),
      // 未入力(空文字やスペースのみ)ならnullにして、
      // 表示側の `post.nickname || "名無しさん"` に任せる。
      nickname:
        typeof nickname === "string" && nickname.trim() !== ""
          ? nickname.trim()
          : null,
    },
  });

  // タイムライン("/")はServer Componentがデータをキャッシュしうるため、
  // 遷移前に明示的にキャッシュを破棄して最新の投稿一覧を取れるようにする。
  revalidatePath("/");
  redirect("/");
}
