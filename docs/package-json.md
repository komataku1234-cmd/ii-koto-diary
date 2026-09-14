# package.jsonの各項目メモ

`package.json`はコメントを書けない(書くと`pnpm install`などがJSON構文エラーで
止まってしまう)ため、各項目の意味・理由をこのファイルに書き残す。

## `name`

プロジェクト(パッケージ)の名前。`create-next-app`で作った時の初期値`"app"`が
そのまま残っている。npmに公開する場合は小文字・ハイフン区切り(kebab-case)が
慣習で、`"ii-koto-diary"`のように実際のプロジェクト名に変えるのが望ましい。

## `version`

このアプリ自体のバージョン。Node.jsなどのバージョンとは無関係。
`Major.Minor.Patch`の3段階で管理する慣習(セマンティックバージョニング)。

- `0.x.y` → まだ開発中・正式リリース前、という意味合いの慣習
- `1.0.0` → 最初の完成版・安定版、という節目
- その後は、小さな修正は`1.0.1`(パッチ)、後方互換のある機能追加は`1.1.0`
  (マイナー)、破壊的変更は`2.0.0`(メジャー)、という上げ方をする

npmや他のツールがこの数字を見て動作を変えることは無く、あくまで人間が
完成度を記録するための項目。

## `private`

`true`にしておくと、`npm publish`(パッケージの公開)を誤って実行しても、
npm側がエラーで拒否してくれる安全装置。このアプリはライブラリとして配布
するものではないため付けている。この説明でnpmと言っているがそれはこのjsonは
もともとnpmが元で作られてそれに後に登場したpnpmはnpmの設定しても互換性を保つように作られたためnpm publishにしても問題ない
pnpm publishでも別に問題ない(らしい。試してない)

## `packageManager`

```json
"packageManager": "pnpm@11.17.0"
```

pnpm自体(道具そのもの)のバージョンを固定するための項目。

### なぜ追加したか

`Dockerfile`では`corepack prepare pnpm@latest --activate`としており、
「latest」はビルドするタイミングによって指す実体が変わる。`pnpm-lock.yaml`は
依存パッケージのバージョンは厳密に固定してくれるが、それを読み込んで
インストール作業をする**pnpmという道具自体のバージョン**までは固定してくれない。
道具のバージョンが変わると、ロックファイルの形式が変わったり、依存関係の
組み立て方(hoisting)が微妙に変わったりする可能性がゼロではないため、
この項目で固定することにした。

### 仕組み

`corepack`は、プロジェクトの`package.json`に`packageManager`が書かれていれば、
Dockerfileの`--activate`で設定した初期値より**そちらを優先**する。このプロジェクトの
フォルダ内で`pnpm`コマンドを実行すると、自動的にここで指定したバージョンが
使われる(無ければ自動でダウンロードしてくれる)。

## `scripts`

`pnpm <名前>`で呼び出せる、コマンドの短縮名の一覧。

- `dev` → `next dev -p 3001`(開発サーバー起動、ポートは3001に固定)
- `build` → `prisma migrate deploy && prisma generate && next build`
  (DBマイグレーション適用→Prismaクライアント生成→Next.jsの本番ビルド、の順)
- `start` → `next start`(ビルド済みのものを本番モードで起動。) vercelは独自でやるため使ってない     
- `lint` → `eslint`(コードチェック)　pnpm lint →ファイル全体 pnpm exec eslint src/app/error.tsx →特定のファイル
eslint.config.mjsでどのくらい厳しくチェックするとか決めてる

## `dependencies` と `devDependencies` の違い

**「本番で実際にアプリが動いている間も必要かどうか」**で分かれている。

### `dependencies`(本番でも必要)

- `next` / `react` / `react-dom` → アプリの動作そのものに必須
- `@prisma/client` → 実行時にDBへ問い合わせるためのクライアント
- `@prisma/adapter-pg` → PrismaがPostgreSQLに接続するためのアダプタ

### `devDependencies`(開発・ビルド時だけ必要)

- `typescript` → JSに変換するのはビルド時だけ。動いているアプリはただのJS
- `eslint` / `eslint-config-next` → コードチェックは書いている時だけ使う
- `prisma`(CLI本体) → マイグレーション・生成コマンドを打つ時だけ使う
  (実行時に使うのは`@prisma/client`の方)
- `tailwindcss` / `@tailwindcss/postcss` → CSSを生成するのはビルド時だけ
- `@types/node` / `@types/react` / `@types/react-dom` → 型情報は実行時には
  存在しない、あくまでコードを書く時の補助
- `tsx` → `prisma/seed.ts`のようなTypeScriptファイルを直接実行するための
  開発用ツール
- `dotenv` → `.env`の値を読み込むためのツール(主にスクリプト実行時に使用)

### なぜ分けるのか

本番環境(Vercelなど)にデプロイする際、`devDependencies`はインストールを
省略できる。無駄なパッケージを本番に持ち込まないことで、デプロイのサイズや
時間を減らせる。
