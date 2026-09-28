import { cookies } from "next/headers";

const REACTED_COOKIE_NAME = "reacted";
const REACTED_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
// Cookieの容量上限(約4KB)に収めるため、超えた分は古いものから捨てる
const MAX_REACTED_ENTRIES = 300;
const ENTRY_PATTERN = /^\d+:\d+$/;

export function reactedKey(postId: number, reactionTypeId: number) {
  return `${postId}:${reactionTypeId}`;
}

export async function getReacted(): Promise<Set<string>> {
  const cookieStore = await cookies();
  const value = cookieStore.get(REACTED_COOKIE_NAME)?.value ?? "";
  // Cookieはユーザーが書き換えられる値なので、形式に合う要素だけを採用する
  return new Set(value.split(",").filter((entry) => ENTRY_PATTERN.test(entry)));
}

export async function saveReacted(reacted: Set<string>) {
  const entries = [...reacted].slice(-MAX_REACTED_ENTRIES);
  const cookieStore = await cookies();
  cookieStore.set(REACTED_COOKIE_NAME, entries.join(","), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REACTED_COOKIE_MAX_AGE,
    path: "/",
  });
}
