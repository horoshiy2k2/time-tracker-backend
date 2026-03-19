-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('COIN_X2_NEXT_SESSION', 'COIN_X2_TIMED');

-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'BOOST';

-- CreateTable
CREATE TABLE "BoostItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'BOOST',
    "boostKind" "EffectType" NOT NULL,
    "isInInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEffect" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "effectType" "EffectType" NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "expiresAt" TIMESTAMP(3),
    "chargesLeft" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEffect_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserEffect" ADD CONSTRAINT "UserEffect_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
