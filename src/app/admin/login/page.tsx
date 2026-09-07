import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-base font-semibold">管理者ログイン</h2>
      <LoginForm />
    </div>
  );
}
