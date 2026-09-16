import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_auth";
// 一定時間の目安として12時間。要件上は具体的な長さが未確定のため仮の値。
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12;

// パスワードそのものをCookieに入れるのを避けるため、ハッシュ値だけをやり取りする。
// ハッシュ値を16進数に変換してリターン
function adminAuthToken() {
  return createHash("sha256").update(process.env.ADMIN_PASSWORD ?? "").digest("hex");
}

//setAdminAuthCookieで保存したユーザーであれば再ログインを求めない
export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === adminAuthToken();
}

//クッキーに設定
export async function setAdminAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, adminAuthToken(), {
    httpOnly: true, // JSから読めなくしてXSSでの値の盗み見を防ぐ Cookieの中身を見せなくする xss:攻撃者がそのページ上で動くJavaScriptを不正に紛れ込ませる攻撃
    secure: process.env.NODE_ENV === "production", // 本番はHTTPS限定で盗聴を防ぐ(ローカル開発はhttpなのでdevでは無効化)
    sameSite: "lax", // 他サイトからの裏側のリクエストにはCookie付けずCSRFを防ぐ これしないと管理者操作ができてしまう可能性がある CSRF:攻撃者が用意した別サイトに、あなたのアプリへの隠しリクエストを仕込んでおき、それをログイン中の被害者に気づかせずに実行させる攻撃です。
    maxAge: ADMIN_COOKIE_MAX_AGE, // この時間が経つと自動失効し、要件通り再ログインが必要になる
    path: "/admin", // 管理者機能で使う場所だけに絞る(最小権限。他ページへのリクエストには不要に付けない)
  });
}
