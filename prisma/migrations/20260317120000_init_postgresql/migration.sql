-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('CHEST', 'COLOR_DROP', 'COLOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "progressColor" TEXT NOT NULL DEFAULT '#646cff',
    "textColor" TEXT NOT NULL DEFAULT '#333333',
    "buttonColor" TEXT NOT NULL DEFAULT '#646cff',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'CHEST',
    "isInInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorDrop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'COLOR_DROP',
    "r" INTEGER NOT NULL,
    "g" INTEGER NOT NULL,
    "b" INTEGER NOT NULL,
    "isInInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColorDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "type" "ItemType" NOT NULL DEFAULT 'COLOR',
    "r" INTEGER NOT NULL,
    "g" INTEGER NOT NULL,
    "b" INTEGER NOT NULL,
    "isInInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentSession" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrentSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentSession" ADD CONSTRAINT "CurrentSession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

