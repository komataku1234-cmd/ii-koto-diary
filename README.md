# ii-koto-diary（匿名「ひとこと日記」共有アプリ）

「今日あったちょっといいこと」を匿名で投稿し、みんなの投稿がタイムライン形式で流れる日記共有アプリです。

- 一般ユーザーはアカウント登録・ログイン不要で投稿・閲覧・リアクションができます。
- 管理者は固定パスワードでログインし、全投稿の検索・編集・削除（ソフトデリート）を行えます。

詳しい要件は [requirements.md](./requirements.md) を参照してください。

## 技術スタック

- Next.js 16 (App Router, Turbopack)
- React 19
- Prisma + PostgreSQL
- Tailwind CSS

## クローン後のセットアップ

このリポジトリは pnpm と Dev Container を使用しています。`.pnpm-store` や `node_modules` などのビルド成果物は `.gitignore` の対象で、リポジトリには**コミットされていません**。クローン後は自分で依存関係をインストールする必要があります。

### 方法A: VS Code Dev Containers（推奨）

1. リポジトリをクローンし、VS Code で開く。
2. [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) をインストールしていない場合はインストールする。
3. **Dev Containers: Reopen in Container** を実行する。Docker イメージがビルドされ、`.devcontainer/devcontainer.json` の `postCreateCommand` によって自動的に `pnpm install` が実行される。
4. コンテナの準備ができたら、統合ターミナルで `pnpm dev` を実行する。

### 方法B: Docker Compose

```bash
docker compose up -d
docker compose exec app pnpm install
docker compose exec app pnpm dev
```

### 方法C: ローカルの Node/pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm dev
```

セットアップ後、ブラウザで [http://localhost:3001](http://localhost:3001) を開くと確認できます。

## 環境変数

`.env` に以下を設定してください（ローカル開発用の値の例）。

```
DATABASE_URL="postgresql://postgres:postgres@ii-koto-diary-db:5432/ii_koto_diary"
```
