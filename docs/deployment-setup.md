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

> **進捗メモ**: `package.json`に適用済み(`prisma generate`部分・`VERCEL_ENV`分岐部分とも反映済み)。

### この形にした理由

- `develop`ブランチへのpush(Previewビルド)のたびに無条件でマイグレーションすると、まだ本番に出す準備ができていないスキーマ変更が先に適用されてしまう危険がある
- マイグレーションを手元のPCから`vercel env pull`して実行する方法も検討したが、本番の接続情報がローカルにコピーされる・`.env.local`の消し忘れでローカル開発が誤って本番DBに繋がる事故のリスクがあるため不採用。Vercelのビルド環境内だけで完結する今の方式の方が安全

## 2. データベース構成(Neon + Vercel連携)

VercelのStorage(Marketplace)から**Neon**を接続した。設定内容:

- **Custom Environment Variable Prefix**: 空欄のまま(プレフィックス無し)。コード側(`src/lib/prisma.ts`)は`process.env.DATABASE_URL`という名前で読んでいるため、プレフィックスを付けると見つからなくなる
- **Create database branch for deployment**:
  - **Preview: ON** → `develop`など本番以外へのpush(Previewデプロイ)のたびに、専用の独立したDBブランチ(コピー)が自動で作られる
  - **Production: OFF** → 本番は毎回同じ、ずっと使い続ける1つのDBブランチを使う(本番デプロイのたびに新しいブランチに切り替わってはいけないため)

この設定により、**PreviewとProductionのデータは分離される**(当初「同じDBを共有する」で検討していたが、この機能により変更。Previewでテスト投稿しても本番のタイムラインには影響しない)。

### 自動で追加される環境変数について

Neon連携により`DATABASE_URL`以外にも`DATABASE_URL_UNPOOLED`・`POSTGRES_URL`・`PGHOST`など多数の変数が自動で追加されるが、これは仕様通り(用途違いのバリエーションをまとめて用意してくれている)。このアプリが実際に使うのは`DATABASE_URL`のみ。

> **要確認**: `prisma migrate deploy`はプーリングされた接続だと正常に動かないことがあるとされている。エラーが出た場合は、マイグレーション実行時だけ`DATABASE_URL_UNPOOLED`(直接接続用)を使うよう調整する。

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
