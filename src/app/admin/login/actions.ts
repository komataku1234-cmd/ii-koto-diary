"use server";

import { redirect } from "next/navigation";
import {
  clearLoginAttempts,
  createAdminSession,
  getClientIp,
  registerLoginAttempt,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export async function login(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const ip = await getClientIp();

  // パスワードを確認する前に回数制限を確認する。ロック中は、正しいパスワードでも拒否する
  const { locked } = await registerLoginAttempt(ip);
  if (locked) {
    return {
      error:
        "ログインの失敗が続いたため、一時的にロックしています。15分ほど時間をおいてから、もう一度お試しください。",
    };
  }

  const password = formData.get("password");

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return { error: "パスワードが正しくありません。" };
  }

  await clearLoginAttempts(ip);
  await createAdminSession();
  redirect("/admin");
}
