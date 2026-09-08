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
    <form action="/" method="get" className="flex flex-col gap-2 sm:flex-row">
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
      <button
        type="submit"
        className="shrink-0 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        検索
      </button>
    </form>
  );
}
