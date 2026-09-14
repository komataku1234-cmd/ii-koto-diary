# 今のnode22の最新版取ってくる
FROM node:22-trixie-slim

# 開発に必要な OS パッケージ
# node22をインストールしたのが古い情報の可能性があるからupdateしてからインストールしている
# && rm -rf /var/lib/apt/lists/*: キャッシュを削除してイメージサイズを小さくする 別runではイメージサイズを小さくできない
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# pnpm を有効化
# corepack enable:プロジェクトが要求するpnpmのバージョンと、実際に使われるバージョンを必ず一致させられる(今回はしていない)　nodo公式の推奨方法
# package.jsonに"packageManager": "pnpm@9.1.0"のように書いておくてバージョンを揃えられる
# corepack prepare pnpm@latest --activate:pnpmの最新バージョンをインストールして有効化する pnpm呼ばれた時にこのバージョンを採用する
RUN corepack enable && corepack prepare pnpm@latest --activate

#作業ディレクトリを指定する
WORKDIR /app