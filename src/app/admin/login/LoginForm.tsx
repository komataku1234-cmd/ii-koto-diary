"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  // state:loginが最後に返す値、または第二引数(初期値)
  // formAction:呼ばれた時にloginを呼びたして、stateに渡す
  // pending:実行中かどうか
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          管理者パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.error}
        </p>
      )}

      {/* cursor-pointer → buttonはaタグと違いデフォルトではポインターにならない(cursor:default)ため、明示的に指定する。
          disabled:cursor-not-allowed → pending中(disabled)はクリックできないことが分かるよう、あえてポインターに戻す */}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "確認中..." : "ログイン"}
      </button>
    </form>
  );
}
