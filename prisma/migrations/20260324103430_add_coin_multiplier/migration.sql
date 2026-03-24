-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coinMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "coinMultiplierUntil" TIMESTAMP(3);
