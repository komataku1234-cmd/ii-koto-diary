import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  await prisma.reaction.deleteMany();
  await prisma.post.deleteMany();
  await prisma.reactionType.deleteMany();

  const [good, wakaru, hokkori] = await Promise.all(
    [
      { name: "いいね", emoji: "👍" },
      { name: "わかる", emoji: "🙌" },
      { name: "ほっこり", emoji: "🥰" },
    ].map((reactionType) => prisma.reactionType.create({ data: reactionType }))
  );

  await prisma.post.create({
    data: {
      nickname: "たぬき",
      content: "電車で席を譲ったら、笑顔でありがとうって言ってもらえた。",
      reactions: {
        create: [{ reactionTypeId: good.id }, { reactionTypeId: hokkori.id }],
      },
    },
  });

  await prisma.post.create({
    data: {
      nickname: null,
      content: "コンビニのレジで店員さんが「今日も一日お疲れ様です」って言ってくれた。",
      reactions: {
        create: [{ reactionTypeId: wakaru.id }],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
