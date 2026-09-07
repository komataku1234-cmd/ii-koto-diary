"use server";

import { redirect } from "next/navigation";
import { setAdminAuthCookie } from "@/lib/adminAuth";

export async function login(_prevState: { error?: string }, formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    return { error: "パスワードが正しくありません。" };
  }

  await setAdminAuthCookie();
  redirect("/admin");
}
