import { PrismaPg } from '@prisma/adapter-pg'       //PrismaPg は PostgreSQL と実際に通信するドライバー
import { PrismaClient } from '@/generated/prisma/client'  // src/generated/prismaに自動生成してたもの

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma