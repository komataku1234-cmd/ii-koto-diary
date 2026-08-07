This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Setup after cloning

This repo uses pnpm and a Dev Container. `.pnpm-store`, `node_modules`, and other build artifacts are gitignored and are **not** committed — you need to install dependencies yourself after cloning.

### Option A: VS Code Dev Containers (recommended)

1. Clone the repo and open it in VS Code.
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) if you don't have it.
3. Run **Dev Containers: Reopen in Container**. This builds the Docker image and automatically runs `pnpm install` (via `postCreateCommand` in `.devcontainer/devcontainer.json`).
4. Once the container is ready, run `pnpm dev` in the integrated terminal.

### Option B: Docker Compose

```bash
docker compose up -d
docker compose exec app pnpm install
docker compose exec app pnpm dev
```

### Option C: Local Node/pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm dev
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
