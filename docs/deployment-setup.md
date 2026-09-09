# 本番環境の構築方針(ビルド・マイグレーション・seed)

Vercelにデプロイするにあたって決めた、ビルド・DBマイグレーション・seedの方針と、実行するコマンドをまとめる。

## 1. ビルドコマンド(`package.json`の`build`)

Vercelはpushを検知すると、`package.json`の`scripts.build`に書かれたコマンドをそのまま実行する(`pnpm-lock.yaml`があるので`pnpm build`として実行される)。

### 採用した内容

```json
"build": "if [ \"$VERCEL_ENV\" = \"production\" ]; then prisma migrate deploy; fi && prisma generate && next build"
```

- `prisma generate` → `src/generated/prisma`(Prismaが生成するクライアントのコード)は`.gitignore`対象でリポジトリにpushされないため、ビルドのたびに生成し直す必要がある。無いと`next build`が失敗する
- `if [ "$VERCEL_ENV" = "production" ]; then prisma migrate deploy; fi` → Vercelが自動でセットする`VERCEL_ENV`(`production`/`preview`/`development`)を見て、**本番ビルドのときだけ**マイグレーションを実行する

> **進捗メモ**: `prisma generate && next build`の部分は`package.json`に適用済み。`VERCEL_ENV`による`migrate deploy`の条件分岐はまだ未適用(次回コードに反映する)。

### この形にした理由

- `develop`ブランチへのpush(Previewビルド)のたびに無条件でマイグレーションすると、共有DB構成(後述)の場合、まだ本番に出す準備ができていないスキーマ変更が先に適用されてしまう危険がある
- マイグレーションを手元のPCから`vercel env pull`して実行する方法も検討したが、本番の接続情報がローカルにコピーされる・`.env.local`の消し忘れでローカル開発が誤って本番DBに繋がる事故のリスクがあるため不採用。Vercelのビルド環境内だけで完結する今の方式の方が安全

## 2. データベース構成

**PreviewとProductionで同じ`DATABASE_URL`(同じDB)を共有する**構成を採用する(個人開発規模のため、DBを2つ用意するコストは今はかけない)。

### この構成の注意点

- Previewデプロイで投稿・コメント・リアクションを操作すると、**そのまま本番の投稿一覧にも反映される**(別々のDBではなく、同じ1つのDBを見ているだけのため)
- Previewで動作確認したテストデータは、確認後に管理画面から削除する運用で対応する
- DBの構造を変える機能は、`main`にマージしてマイグレーションが適用されるまでPreview上では正しく動作しない制約がある(受け入れる)

## 3. Seed(初期データ投入)

現状の`prisma/seed.ts`(`deleteMany`で全部消してからサンプル投稿ごと作り直す作り)は**本番には使わない**。本番で必要なのは`ReactionType`のマスタデータだけなので、以下のSQLを**手動で1回だけ**実行する。

```sql
INSERT INTO "ReactionType" (name, emoji) VALUES
  ('いいね', '👍'),
  ('わかる', '🙌'),
  ('ほっこり', '🥰');
```

## 4. 本番DBをリセットしたくなった場合

投稿・コメント・リアクションのデータだけを消して、マスタデータ(`ReactionType`)は残したい場合。

```sql
TRUNCATE TABLE "Reaction", "Reply", "Post" RESTART IDENTITY CASCADE;
```

- `RESTART IDENTITY`でID(連番)も1から振り直される
- `"ReactionType"`は対象に含めないのでマスタデータは残る
