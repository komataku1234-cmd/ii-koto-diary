これは [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) で作成された [Next.js](https://nextjs.org) プロジェクトです。

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

## はじめに

まず、開発サーバーを起動します。

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと結果が確認できます。

`app/page.tsx` を編集することでページの編集を開始できます。ファイルを編集するとページは自動的に更新されます。

このプロジェクトでは、Vercel の新しいフォントファミリーである [Geist](https://vercel.com/font) を自動的に最適化して読み込むために [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) を使用しています。

## 詳しく学ぶ

Next.js についてさらに詳しく知りたい場合は、以下のリソースを参照してください。

- [Next.js Documentation](https://nextjs.org/docs) - Next.js の機能や API について学べます。
- [Learn Next.js](https://nextjs.org/learn) - インタラクティブな Next.js チュートリアルです。

[Next.js の GitHub リポジトリ](https://github.com/vercel/next.js) もぜひご覧ください。フィードバックやコントリビューションを歓迎しています。

## Vercel へのデプロイ

Next.js アプリをデプロイする最も簡単な方法は、Next.js の開発元による [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) を使うことです。

詳細は [Next.js のデプロイに関するドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
