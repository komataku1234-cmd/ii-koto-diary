import { prisma } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      reactions: {
        include: { reactionType: true },
      },
      replies: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" }, // 投稿は新着順だが、コメントは会話の流れが分かるよう古い順にする
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">タイムライン</h2>

      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">投稿はまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => {
            // DB側でGROUP BYすると別クエリ+postIdでの再マージが必要になり複雑になるため、
            // includeで取得した生のリアクション行をここでJS側で種類ごとに集計している。
            const reactionCounts = new Map<number,{ emoji: string; name: string; count: number }>();
            for (const reaction of post.reactions) {
              const current = reactionCounts.get(reaction.reactionTypeId);
              if (current) {
                current.count += 1;
              } else {
                reactionCounts.set(reaction.reactionTypeId, {
                  emoji: reaction.reactionType.emoji,
                  name: reaction.reactionType.name,
                  count: 1,
                });
              }
            }

            return (
              <li
                key={post.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {post.nickname || "名無しさん"}
                  </span>
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
                {reactionCounts.size > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Map.values()はイテレータで.mapが使えないため配列に変換してから展開 */}
                    {[...reactionCounts.values()].map((reaction) => (
                      <span
                        key={reaction.name}
                        className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                      >
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                )}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
