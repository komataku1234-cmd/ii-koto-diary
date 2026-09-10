"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function addReaction(formData: FormData) {
  const postId = Number(formData.get("postId"));
  const reactionTypeId = Number(formData.get("reactionTypeId"));

  // hidden inputの値を書き換えて変な値を送ってくることもできるため、
  // 数値として解釈できることを念のため確認してから使う
  if (!Number.isInteger(postId) || !Number.isInteger(reactionTypeId)) {
    throw new Error("不正なリクエストです。");
  }

  await prisma.reaction.create({
    data: { postId, reactionTypeId },
  });

  // このページ("/")のフォームから呼ばれる想定なのでredirectはせず、
  // 最新のリアクション件数が表示されるようキャッシュだけ更新する
  revalidatePath("/");
}

const MAX_REPLY_LENGTH = 30;
const MAX_NICKNAME_LENGTH = 20;


export async function createReply(formData: FormData) {
  const postId = Number(formData.get("postId"));
  const nickname = formData.get("nickname");
  const content = formData.get("content");

  if (!Number.isInteger(postId)) {
    throw new Error("不正なリクエストです。");
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("コメントを入力してください。");
  }
  // trim()前の長さで判定すると、IMEの変換確定時などに紛れ込む
  // 末尾の改行・空白まで文字数に数えてしまい、
  // 見た目は上限内なのにエラーになる不整合が起きるため、
  // 実際に保存する文字列(trim()後)と同じ基準で判定する。
  if (content.trim().length > MAX_REPLY_LENGTH) {
    throw new Error(`コメントは${MAX_REPLY_LENGTH}文字以内で入力してください。`);
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

  await prisma.reply.create({
    data: {
      postId,
      content: content.trim(),
      // 未入力ならキー自体を省略し、DB側の@default("名無しさん")を適用させる
      ...(typeof nickname === "string" && nickname.trim() !== ""
        ? { nickname: nickname.trim() }
        : {}),
    },
  });

  revalidatePath("/");
}
