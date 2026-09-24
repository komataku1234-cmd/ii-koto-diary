import { prisma } from "@/lib/prisma";
import { addReaction, createReply } from "./actions";
import { SearchSortForm } from "./SearchSortForm";
import { MAX_REPLY_LENGTH, MAX_NICKNAME_LENGTH } from "@/lib/constants";

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
        // 投稿の本文・ニックネーム、またはコメントの本文・ニックネームのどれかに部分一致すればヒットさせる
        // コメントは「1件でも一致するものがある(some)」投稿を対象にする。
        // 削除済みコメントは画面に表示されないので、それで投稿がヒットしないよう deletedAt: null も条件に入れる
        //スプレッドがないと文法エラー。オブジェクトとして出てくるから
        ...(keyword?
            {
              OR: [
                { content: { contains: keyword, mode: "insensitive" } },
                { nickname: { contains: keyword, mode: "insensitive" } },
                {
                  replies: {
                    some: {
                      deletedAt: null,
                      OR: [
                        { content: { contains: keyword, mode: "insensitive" } },
                        { nickname: { contains: keyword, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            }
            : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {//条件付きで取得
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" }, // 投稿は新着順だが、コメントは会話の流れが分かるよう古い順にする
        },
      },
    }),
    prisma.reactionType.findMany({ orderBy: { id: "asc" } }),
  ]);

  // リアクションの生データは取得せず、投稿×絵文字の組み合わせごとの件数だけをDB側(groupBy)で集計する。
  // 生データを1件ずつ運んでJSでfilterする方式だと、リアクションが増えるほど転送量・計算量が増えてしまうため。
  //postIds=[1,2,3]
  const postIds = posts.map((post) => post.id);
  const reactionCounts = await prisma.reaction.groupBy({
    by: ["postId", "reactionTypeId"],
    where: { postId: { in: postIds } },
    _count: true,
  });

  // postId→reactionTypeId→件数 の2段構えのMapにして、後で使うときにO(1)で引けるようにする
  const reactionCountMap = new Map<number, Map<number, number>>();
  for (const rc of reactionCounts) {
    if (!reactionCountMap.has(rc.postId)) {
      reactionCountMap.set(rc.postId, new Map());
    }
    // !:undefinedを否定
    reactionCountMap.get(rc.postId)!.set(rc.reactionTypeId, rc._count);
  }
  //eactionCountMap.get(postId)でundefinedだったら.get(reactionTypeId) を実行しない。0を投げる
  const getReactionCount = (postId: number, reactionTypeId: number) =>
    reactionCountMap.get(postId)?.get(reactionTypeId) ?? 0;

  // 特定の絵文字(リアクション種類)が多い順のときだけ、取得済みのpostsをJS側で並び替える。
  // 並び替え自体はJSで行うが、件数そのものはDBのgroupByで集計済みのMapから引くだけ。
  // Number.isIntegerのチェックが無いと、?sort=abc のような不正な値で
  // Number("abc")=NaNになった場合もif文を素通りしてしまう
  // (NaNはundefinedではないため)。並び替え自体が無意味になるので念のため弾く。
  if (sortReactionTypeId !== undefined && Number.isInteger(sortReactionTypeId)) {
    posts.sort((a, b) => {
      const countA = getReactionCount(a.id, sortReactionTypeId);
      const countB = getReactionCount(b.id, sortReactionTypeId);
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
              <li
                key={post.id}
                className="rounded-lg border border-slate-200 bg-white p-4"> {/* rounded：角丸 border:枠線*/}
                {/* items-baseline → 文字サイズ(text-sm と text-xs)が違う2つを並べたとき、
                    中央揃え(items-center)だと微妙にズレて見えるので、文字のベースライン(下端の基準線)で揃える */}
                <div className="flex items-baseline justify-between gap-2">
                  {/* truncate → whitespace-nowrap(1行固定)+overflow-hidden(隠す)+text-overflow-ellipsis(...にする)をまとめて指定。
                      横スクロールの受け皿が無いページなので、はみ出さずに"..."で省略させる。
                      min-w-0 → flexの子要素はデフォルトで「中身の幅より縮めない」性質があり、
                      これが無いとtruncateが効かずニックネームが縮まないままはみ出してしまう */}
                  <span className="min-w-0 truncate text-sm font-medium">
                    {/* nicknameは未入力でもDBの@defaultで必ず文字列が入っているため穴埋め不要 */}
                    {post.nickname}
                  </span>
                  {/* shrink-0 → flexコンテナの幅が足りないとき、他の要素(ニックネーム側)を優先して縮め、
                      この日時表示は縮めない(潰れて折り返さないようにする) */}
                  <time
                    className="shrink-0 text-xs text-slate-400"
                    dateTime={post.createdAt.toISOString()} //スクリーンリーダー(読み上げソフト)利用者向けのアクセシビリティ配慮
                  >
                    {dateFormatter.format(post.createdAt)}
                  </time>
                </div>
                {/* whitespace-pre-wrap → 本来HTMLは改行やスペースを詰めて1行にしてしまうが、
                    投稿フォームで打った改行をそのまま表示しつつ、長い行は折り返してはみ出さないようにする */}
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {post.content}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">{/* flex-wrap → 横幅が足りなくなったら折り返す */}
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
                        {getReactionCount(post.id, reactionType.id)}
                      </button>
                    </form>
                  ))}
                </div>
                {post.replies.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                    {post.replies.map((reply) => (
                      <li key={reply.id} className="text-xs">
                        <span className="font-medium text-slate-600">
                          {reply.nickname}
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
                  className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">{/* border-t → 上線 */}
                  <input type="hidden" name="postId" value={post.id} />
                  {/* self-start → 親(flex flex-col)は子要素を横幅いっぱいに伸ばす(デフォルトのstretch)ので、
                      それを打ち消して本来の幅(w-32で指定した分)だけにする */}
                  <input
                    type="text"
                    name="nickname"
                    maxLength={MAX_NICKNAME_LENGTH}
                    placeholder="名無しさん"
                    className="w-32 self-start rounded-md border border-slate-300 px-2 py-1 text-xs"
                  />
                  <div className="flex gap-2">
                    {/* flex-1 → 隣の送信ボタン(shrink-0で幅固定)以外の余ったスペースを、この入力欄が全部埋める */}
                    <input
                      type="text"
                      name="content"
                      required
                      maxLength={MAX_REPLY_LENGTH}
                      placeholder="コメントする"
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    {/* cursor-pointer → buttonはaタグと違いデフォルトではポインターにならない(cursor:default)ため、
                        明示的に指定する */}
                    <button
                      type="submit"
                      className="shrink-0 cursor-pointer rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white"
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
