import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 例: 画像最適化機能(next/image)で読み込みを許可する外部ドメインを指定する
  // images: {
  //   remotePatterns: [{ protocol: "https", hostname: "example.com" }],
  // },

  // 例: 古いURLから新しいURLへのリダイレクトルールを定義する
  // async redirects() {
  //   return [{ source: "/old-path", destination: "/new-path", permanent: true }];
  // },

  // 例: Dockerコンテナ等で自己ホスティングする場合、必要なファイルだけをまとめた
  // 軽量な出力形式にする(Vercelにデプロイする分には不要)
  // output: "standalone",
};

export default nextConfig;
