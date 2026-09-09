# 本番環境の構築方針(ビルド・マイグレーション・seed)

Vercelにデプロイするにあたって、ビルド・DBマイグレーション・seedをどう扱うか、その理由も含めてまとめる。

## 1. ビルドコマンド(`package.json`の`build`)

Vercelはpushを検知すると、`package.json`の`scripts.build`に書かれたコマンドをそのまま実行する(`pnpm-lock.yaml`があるので`pnpm build`として実行される)。つまり**このプロジェクトの`build`スクリプトの中身が、そのままVercel上でのビルド手順になる**。

現状:

```json
"scripts": {
  "build": "next build"
}
```

### なぜこのままだとVercelでビルドが失敗するか

- `src/generated/prisma`(Prismaが生成するクライアントのコード)は`.gitignore`対象で、リポジトリにpushされていない
- これまではDev Container内で`prisma migrate dev`や`prisma generate`を手動実行して、その場でクライアントを生成していた
- `package.json`に`postinstall`のようなクライアント自動生成の仕組みも無い
- Vercelはリポジトリのソースコードしか持っていないので、このままだと`@/generated/prisma/client`のimportが解決できずビルドエラーになる

### 対応方針

`build`スクリプトを、ビルド前に`prisma generate`を実行するよう変更する。

```json
"build": "prisma generate && next build"
```

## 2. マイグレーション(`prisma migrate deploy`)

`prisma migrate dev`(開発用。対話的でシードも絡む)とは別に、`prisma migrate deploy`(本番用。溜まっているマイグレーションSQLを適用するだけ、対話無し)を使う。

### なぜ`build`スクリプトに無条件で組み込まない(自動実行しない)か

このプロジェクトは`develop`ブランチ→Preview環境、`main`ブランチ→Production環境という運用にしている。もし`build`に`prisma migrate deploy`を無条件で含めると、**`develop`へのpush(Previewビルド)のたびにも本番DBのスキーマが変更されてしまう**。

これが危険な理由:
- 今実際に動いている本番コード(まだ`main`にマージされていない、古いバージョン)は、変更前のテーブル構造を前提に動いている
- 「コードを本番に反映するタイミング」と「DBの構造を変えるタイミング」がズレると、まだ古いコードが動いている本番環境が、スキーマ変更の影響で壊れる可能性がある
- マイグレーションは「意図したタイミングで、コードのデプロイとセットで」行うべきもので、開発中のブランチへのpushのたびに勝手に走ってよいものではない

### 対応方針(2案、まずは①から)

**① 手動で実行する(最初はこちら)**

`main`にマージして本番デプロイするタイミングで、自分の手元から本番の`DATABASE_URL`に向けて実行する。

```bash
vercel env pull   # 本番の環境変数を手元に取得
pnpm exec prisma migrate deploy
```

**② 本番ビルドのときだけ自動実行する(慣れてきたら検討)**

Vercelがビルド中に自動でセットする`VERCEL_ENV`(`"production"` / `"preview"` / `"development"`)を使い、Production環境のビルドのときだけマイグレーションする。

```json
"build": "if [ \"$VERCEL_ENV\" = \"production\" ]; then prisma migrate deploy; fi && prisma generate && next build"
```

これならPreviewビルドは本番DBのスキーマに触らず、`main`へのマージ時(=Production環境向けビルド)だけ自動でマイグレーションが適用される。

## 3. Seed(`prisma/seed.ts`)

### なぜビルド・デプロイの一部として自動実行してはいけないか

現状の`seed.ts`は、投入前に

```ts
await prisma.reply.deleteMany();
await prisma.reaction.deleteMany();
await prisma.post.deleteMany();
await prisma.reactionType.deleteMany();
```

と**既存データを全部消してから**サンプルデータを入れ直す作りになっている。これを本番DBに対して実行すると、実際にユーザーが投稿したデータが毎回全部消えてしまう。ビルドやデプロイの一部として自動実行するのは絶対に避ける。

### `ReactionType`(マスタデータ)と、サンプル投稿は分けて考える

- **`ReactionType`(いいね/わかる/ほっこり)** → アプリが動くために本番でも必要なデータ。ただし今の`seed.ts`は投稿のサンプルデータと区別せず一緒に作られている
- **サンプル投稿(たぬき、コンビニの話など)** → 動作確認用のダミーデータ。本番には不要

### 対応方針

- 本番へは、マイグレーション適用後に`ReactionType`だけを**手動で1回**投入する(自動化しない)
- `seed.ts`をそのまま本番の`DATABASE_URL`に向けて実行すると投稿データも巻き込んで全消去されてしまうため、実行する場合は「`ReactionType`だけ投入する版」を別途用意するか、`seed.ts`自体を「存在しなければ作る」形(`deleteMany`せず`upsert`等を使う)に書き換える必要がある(要検討・未着手)

## まとめ

| 項目 | 自動化してよいか | 理由 |
|---|---|---|
| `prisma generate` | ○ 自動でよい | 副作用が無く、無いとビルド自体が失敗するため必須 |
| `prisma migrate deploy` | △ 本番ビルド限定でなら可(まずは手動推奨) | 無条件だとPreviewビルドが本番DBのスキーマを変えてしまう |
| `seed`(現状のスクリプト) | × 自動化しない | 既存データを全消去する作りのため、本番で実行すると事故になる |
