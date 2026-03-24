-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'BOOST';

-- CreateTable
CREATE TABLE "CoinBoost" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "type" "ItemType" NOT NULL,
    "isInInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinBoost_pkey" PRIMARY KEY ("id")
);
