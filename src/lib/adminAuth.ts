import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_auth";
// 一定時間の目安として12時間。要件上は具体的な長さが未確定のため仮の値。
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12;

// パスワードそのものをCookieに入れるのを避けるため、ハッシュ値だけをやり取りする。
// 環境変数が同じ限り毎回同じ値になるので、正しい人が入力したかどうかの照合に使える。
function adminAuthToken() {
  return createHash("sha256").update(process.env.ADMIN_PASSWORD ?? "").digest("hex");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === adminAuthToken();
}

export async function setAdminAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, adminAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });
}
