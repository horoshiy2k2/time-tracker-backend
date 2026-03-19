-- AlterEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'ItemType' AND e.enumlabel = 'BOOST'
  ) THEN
    ALTER TYPE "ItemType" ADD VALUE 'BOOST';
  END IF;
END $$;

-- CreateEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EffectType') THEN
    CREATE TYPE "EffectType" AS ENUM ('COIN_X2_NEXT_SESSION', 'COIN_X2_TIMED');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "darkThemeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "BoostItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'BOOST',
    "effectType" "EffectType" NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 2,
    "isTimed" BOOLEAN NOT NULL DEFAULT false,
    "minDurationHours" INTEGER,
    "maxDurationHours" INTEGER,
    "durationHours" INTEGER,
    "isInInventory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserEffect" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "effectType" "EffectType" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "durationHours" INTEGER,
    "rolledRarity" "Rarity",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ShopProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "effectType" "EffectType",
    "rarity" "Rarity" NOT NULL,
    "cost" INTEGER NOT NULL,
    "multiplier" INTEGER,
    "isTimed" BOOLEAN NOT NULL DEFAULT false,
    "minDurationHours" INTEGER,
    "maxDurationHours" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ShopProduct_slug_key" ON "ShopProduct"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserEffect_userId_effectType_idx" ON "UserEffect"("userId", "effectType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserEffect_expiresAt_idx" ON "UserEffect"("expiresAt");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BoostItem_userId_fkey'
  ) THEN
    ALTER TABLE "BoostItem"
      ADD CONSTRAINT "BoostItem_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserEffect_userId_fkey'
  ) THEN
    ALTER TABLE "UserEffect"
      ADD CONSTRAINT "UserEffect_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
