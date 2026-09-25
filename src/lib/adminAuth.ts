import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE_NAME = "admin_session";
// 一定時間の目安として12時間。要件上は具体的な長さが未確定のため仮の値。
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

// DBにはトークンそのものではなくハッシュ値だけを保存する。
// DBの中身が漏れても、ハッシュ値だけではログインに使えない(Cookieの値は作れない)ため。
// トークンは十分にランダムなので、パスワードと違って高速なSHA-256で問題ない。
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Cookieのトークンに対応する、期限内のセッションがDBにあれば認証済みとみなす
export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const session = await prisma.adminSession.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return session !== null;
}

// ログイン成功時に、ランダムなトークンを発行してDBにセッションを作り、Cookieに設定する
export async function createAdminSession() {
  // 256ビットのランダムな値。推測してあてることは現実的に不可能
  const token = randomBytes(32).toString("hex");

  // 期限切れのセッションが溜まり続けないよう、ログインのたびに掃除する
  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true, // JSから読めなくしてXSSでの値の盗み見を防ぐ Cookieの中身を見せなくする xss:攻撃者がそのページ上で動くJavaScriptを不正に紛れ込ませる攻撃
    secure: process.env.NODE_ENV === "production", // 本番はHTTPS限定で盗聴を防ぐ(ローカル開発はhttpなのでdevでは無効化)
    sameSite: "lax", // 他サイトからの裏側のリクエストにはCookie付けずCSRFを防ぐ これしないと管理者操作ができてしまう可能性がある CSRF:攻撃者が用意した別サイトに、あなたのアプリへの隠しリクエストを仕込んでおき、それをログイン中の被害者に気づかせずに実行させる攻撃です。
    maxAge: ADMIN_SESSION_MAX_AGE, // ブラウザ側でもこの時間で削除される(サーバー側でもDBのexpiresAtで期限を確認している)
    path: "/admin", // 管理者機能で使う場所だけに絞る(最小権限。他ページへのリクエストには不要に付けない)
  });
}
