"use client";

export function SearchSortForm({
  keyword,
  sort,
  reactionTypes,
}: {
  keyword?: string;
  sort?: string;
  reactionTypes: { id: number; emoji: string }[];
}) {
  return (
    // flex-col(縦並び)がデフォルトで、sm:(画面幅が一定以上になったら)だけflex-row(横並び)に切り替える、
    // Tailwindのレスポンシブ記法。スマホでは縦積み、PCでは横並びになる
    <form action="/" method="get" className="flex flex-col gap-2 sm:flex-row">
      {/* flex-1 → 隣の送信ボタン(幅固定)以外の余ったスペースを、このinputが埋めて伸びる */}
      <input
        type="text"
        name="q"
        defaultValue={keyword}
        placeholder="本文・ニックネームで検索"
        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        name="sort"
        defaultValue={sort ?? "new"}
        // 選んだ瞬間にこのformを送信する。ボタンを押すのを待たずに並び替えを反映させたいため。
        // form.submit()と違い、requestSubmit()は実際にボタンを押したのと同じ扱いになる
        // (HTML標準のバリデーションも効くし、送信ボタンのイベントも正しく発火する)。
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="new">新着順</option>
        {reactionTypes.map((reactionType) => (
          <option key={reactionType.id} value={reactionType.id}>
            {reactionType.emoji}が多い順
          </option>
        ))}
      </select>
      {/* shrink-0 → 隣のinput(伸びる)に押し潰されないように、幅固定で縮まないようにする。
          cursor-pointer → buttonはaタグと違いデフォルトではポインターにならない(cursor:default)ため、
          明示的に指定する */}
      <button
        type="submit"
        className="shrink-0 cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        検索
      </button>
    </form>
  );
}
