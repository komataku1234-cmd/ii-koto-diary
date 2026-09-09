import { prisma } from "@/lib/prisma";
import { addReaction, createReply } from "./actions";
import { SearchSortForm } from "./SearchSortForm";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo", // サーバー(コンテナ)のタイムゾーンがUTCなので、表示だけ日本時間に変換する
});

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  // searchParamsはリクエスト時にしか値が分からないためPromiseになっている(このNext.jsのバージョンの仕様)
  //分割代入  q=query
  const { q, sort } = await searchParams;
  //データあればtrim()して前後の空白を除去、無ければ又は空文字ならundefinedにする
  const keyword = q?.trim() || undefined;
  // sortには"new"(新着順)か、リアクション種類のid(文字列)が入る。未指定時は新着順扱い
  const sortReactionTypeId = sort && sort !== "new" ? Number(sort) : undefined;

  // 投稿一覧とリアクション種類マスタは互いに依存しないので並行して取得する
  const [posts, reactionTypes] = await Promise.all([
    prisma.post.findMany({
      where: {
        deletedAt: null,
        // キーワードが無ければ絞り込み条件自体を付けない(未入力時は全件表示)
        // 本文・ニックネームのどちらかに部分一致すればヒットさせる
        //スプレッドがないと文法エラー。
        ...(keyword? 
            {
              OR: [
                { content: { contains: keyword, mode: "insensitive" } },
                { nickname: { contains: keyword, mode: "insensitive" } },
              ],
            }
            : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        reactions: true,//全部取得
        replies: {//条件付きで取得
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" }, // 投稿は新着順だが、コメントは会話の流れが分かるよう古い順にする
        },
      },
    }),
    prisma.reactionType.findMany({ orderBy: { id: "asc" } }),
  ]);

  // 特定の絵文字(リアクション種類)が多い順のときだけ、取得済みのpostsをJS側で並び替える。
  // Prismaのリレーション件数ソート(_count)は「全種類合計」しか数えられず、
  // 「この絵文字だけの件数」でソートする方法が無いため、JSで数えて並び替えている。
  // Number.isIntegerのチェックが無いと、?sort=abc のような不正な値で
  // Number("abc")=NaNになった場合もif文を素通りしてしまう
  // (NaNはundefinedではないため)。並び替え自体が無意味になるので念のため弾く。
  if (sortReactionTypeId !== undefined && Number.isInteger(sortReactionTypeId)) {
    posts.sort((a, b) => {
      // 投稿ごとに「選ばれた絵文字と一致するリアクション」だけ数える
      const countA = a.reactions.filter(
        (r) => r.reactionTypeId === sortReactionTypeId
      ).length;
      const countB = b.reactions.filter(
        (r) => r.reactionTypeId === sortReactionTypeId
      ).length;
      // 多い順(降順)にしたいので「後-前」。逆にすると少ない順になる　sortにreturn 0を返すと順序は変わらない
      return countB - countA;
    });
  }
  // 二重の三項演算子を使うと可読性が落ちるので、変数に入れてから表示する
  const emptyMessage = keyword? `「${keyword}」に一致する投稿は見つかりませんでした。`: "投稿はまだありません。";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">タイムライン</h2>

      <SearchSortForm keyword={keyword} sort={sort} reactionTypes={reactionTypes} />

      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>) 
        : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            // DB側でGROUP BYすると別クエリ+postIdでの再マージが必要になり複雑になるため(下記参照)、
            // includeで取得した生のリアクション行を、表示直前にfilter().lengthで種類ごとに数えている。
            // これはposts.sort()の中のcountA/countBと同じパターン(Mapで先に集計せず、都度数える)。
            //
            // もしDB側(groupBy)でやるなら、こういう別クエリが必要になる↓
            // const grouped = await prisma.reaction.groupBy({
            //   by: ["postId", "reactionTypeId"],
            //   where: { postId: { in: posts.map((p) => p.id) } },
            //   _count: true,
            // });
            // → 結果は投稿とは紐づいていない配列({postId, reactionTypeId, _count})なので、
            // grouped = [{ postId: 7, reactionTypeId: 1, _count: 2 }, { postId: 7, reactionTypeId: 2, _count: 1 }, ...]
            //   post.idと突き合わせて再マージする処理(下記)が別途必要になり複雑になる
            // const countsByPostId = new Map<number, typeof grouped>();
            // for (const g of grouped) {
            //   const list = countsByPostId.get(g.postId) ?? [];
            //   list.push(g);
            //   countsByPostId.set(g.postId, list);
            // }
              <li
                key={post.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                {/* items-baseline → 文字サイズ(text-sm と text-xs)が違う2つを並べたとき、
                    中央揃え(items-center)だと微妙にズレて見えるので、文字のベースライン(下端の基準線)で揃える */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {post.nickname || "名無しさん"}
                  </span>
                  {/* shrink-0 → flexコンテナの幅が足りないとき、他の要素(ニックネーム側)を優先して縮め、
                      この日時表示は縮めない(潰れて折り返さないようにする) */}
                  <time
                    className="shrink-0 text-xs text-slate-400"
                    dateTime={post.createdAt.toISOString()} //スクリーンリーダー利用者向けのアクセシビリティ配慮
                  >
                    {dateFormatter.format(post.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {post.content}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* 押されていない種類も0件のボタンとして常に表示し、押せるようにする */}
                  {reactionTypes.map((reactionType) => (
                    <form key={reactionType.id} action={addReaction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <input
                        type="hidden"
                        name="reactionTypeId"
                        value={reactionType.id}
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                      >
                        {reactionType.emoji}{" "}
                        {
                          post.reactions.filter(
                            (r) => r.reactionTypeId === reactionType.id
                          ).length
                        }
                      </button>
                    </form>
                  ))}
                </div>
                {post.replies.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                    {post.replies.map((reply) => (
                      <li key={reply.id} className="text-xs">
                        <span className="font-medium text-slate-600">
                          {reply.nickname || "名無しさん"}
                        </span>
                        <span className="ml-2 text-slate-500">
                          {reply.content}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  action={createReply}
                  className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3"
                >
                  <input type="hidden" name="postId" value={post.id} />
                  {/* self-start → 親(flex flex-col)は子要素を横幅いっぱいに伸ばす(デフォルトのstretch)ので、
                      それを打ち消して本来の幅(w-32で指定した分)だけにする */}
                  <input
                    type="text"
                    name="nickname"
                    maxLength={20}
                    placeholder="名無しさん"
                    className="w-32 self-start rounded-md border border-slate-300 px-2 py-1 text-xs"
                  />
                  <div className="flex gap-2">
                    {/* flex-1 → 隣の送信ボタン(shrink-0で幅固定)以外の余ったスペースを、この入力欄が全部埋める */}
                    <input
                      type="text"
                      name="content"
                      required
                      maxLength={30}
                      placeholder="コメントする"
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                    >
                      送信
                    </button>
                  </div>
                </form>
              </li>
          ))}
        </ul>
      )}
    </div>
  );
}
