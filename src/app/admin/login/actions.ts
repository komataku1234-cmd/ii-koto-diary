"use server";

import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminPassword } from "@/lib/adminAuth";

export async function login(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return { error: "パスワードが正しくありません。" };
  }

  await createAdminSession();
  redirect("/admin");
}
