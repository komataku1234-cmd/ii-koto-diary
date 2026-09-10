-- 既存のnullを先に既定値へ寄せてから、NOT NULL制約を付ける
-- (nullが残ったままSET NOT NULLすると失敗するため)
UPDATE "Post" SET "nickname" = '名無しさん' WHERE "nickname" IS NULL;
UPDATE "Reply" SET "nickname" = '名無しさん' WHERE "nickname" IS NULL;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "nickname" SET DEFAULT '名無しさん',
                    ALTER COLUMN "nickname" SET NOT NULL;

-- AlterTable
ALTER TABLE "Reply" ALTER COLUMN "nickname" SET DEFAULT '名無しさん',
                    ALTER COLUMN "nickname" SET NOT NULL;
