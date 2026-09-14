# セットアップ方法(Dev Containers以外)

[README.md](../README.md)ではDev Containers(方法A)を推奨方法として案内しているが、
それ以外の方法でもセットアップできる。参考として残しておく。

## 方法B: Docker Compose

VS CodeのDev Containers拡張機能を使わず、Docker Composeを直接操作する方法。

```bash
docker compose up -d
docker compose exec app pnpm install
docker compose exec app pnpm dev
```

## 方法C: ローカルのNode/pnpm

Dockerを使わず、手元のマシンに直接Node.js/pnpmをセットアップする方法。
この場合`docker-compose.yml`のPostgreSQLコンテナは使えないため、`DATABASE_URL`は
別途用意したPostgreSQLを指すように`.env`を変更する必要がある。

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm dev
```

いずれの方法でも、セットアップ後にブラウザで [http://localhost:3001](http://localhost:3001) を開くと確認できる。
