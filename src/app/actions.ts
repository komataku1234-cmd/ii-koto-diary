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
  if (content.length > MAX_REPLY_LENGTH) {
    throw new Error(`コメントは${MAX_REPLY_LENGTH}文字以内で入力してください。`);
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
