import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE_NAME = "admin_session";
// 一定時間の目安として12時間。要件上は具体的な長さが未確定のため仮の値。
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

// 同じIPからのログイン試行がこの回数を超えたらロックする(6回目の試行から拒否)
const MAX_LOGIN_ATTEMPTS = 5;
// 試行を数える期間。この期間より古い記録は数えない(=時間が経てば自動でロックが解ける)
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// 接続元のIPアドレスを取得する。Vercelではx-forwarded-forにVercel側が実際のIPを設定する。
// ヘッダーが無い環境(ローカル開発など)では"unknown"に集約する
export async function getClientIp() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerStore.get("x-real-ip") || "unknown";
}

// ログインを試行するたびに、パスワードを確認する前に呼ぶ。この試行を記録した上で、ロック中かどうかを返す。
// 「数えてから記録」だと、同時に大量に送られたときに上限を超えて通ってしまうため、
// 「先に記録してから数える」順にして、同時送信でも通せるのは最初の数件までにしている
export async function registerLoginAttempt(ip: string) {
  const since = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MS);

  // 期間外の古い記録は、全IP分まとめて掃除する
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: since } } });

  const attempt = await prisma.loginAttempt.create({ data: { ip } });
  const count = await prisma.loginAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });

  if (count > MAX_LOGIN_ATTEMPTS) {
    // ロック中の試行は記録を残さない(攻撃で記録が際限なく増えるのを防ぐ)
    await prisma.loginAttempt.deleteMany({ where: { id: attempt.id } });
    return { locked: true };
  }
  return { locked: false };
}

// ログアウト時に、DBのセッションを消してCookieも削除する。
// DBの行を消すので、Cookieのトークンを別の場所にコピーされていても、その時点で使えなくなる
export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  // Cookieはpath: "/admin"で発行しているため、削除でも同じpathを指定する
  cookieStore.delete({ name: ADMIN_COOKIE_NAME, path: "/admin" });
}

// ログインに成功したら、そのIPの試行記録を消して数え直しにする
export async function clearLoginAttempts(ip: string) {
  await prisma.loginAttempt.deleteMany({ where: { ip } });
}

// DBにはトークンそのものではなくハッシュ値だけを保存する。
// DBの中身が漏れても、ハッシュ値だけではログインに使えない(Cookieの値は作れない)ため。
// トークンは十分にランダムなので、パスワードと違って高速なSHA-256で問題ない。
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// 入力されたパスワードが、環境変数ADMIN_PASSWORDと一致するかを確認する
export function verifyAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;

  // 未設定・空のときは、入力が何であっても必ず拒否する(設定ミスで誰でも入れる状態を防ぐ)
  if (!expected) {
    console.error("ADMIN_PASSWORD が未設定または空のため、ログインを拒否しました。");
    return false;
  }

  // timingSafeEqualは長さが違うとエラーになり、長さの違いから答えを推測される余地もあるため、
  // 両方をSHA-256にして同じ長さ(32バイト)に揃えてから比べる。
  // digest()にhexを指定しないのは、timingSafeEqualが文字列ではなくバイト列(Buffer)を受け取るため
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
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
