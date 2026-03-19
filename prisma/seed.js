const { EffectType, ItemType, PrismaClient, Rarity } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.shopProduct.upsert({
    where: { slug: "coin-boost-next-session" },
    create: {
      slug: "coin-boost-next-session",
      name: "Coin boost 1 session",
      description: "Doubles coins for your next stopped session",
      type: ItemType.BOOST,
      effectType: EffectType.COIN_X2_NEXT_SESSION,
      rarity: Rarity.RARE,
      cost: 40,
      multiplier: 2,
      isTimed: false,
      minDurationHours: null,
      maxDurationHours: null,
      isActive: true,
    },
    update: {
      name: "Coin boost 1 session",
      description: "Doubles coins for your next stopped session",
      type: ItemType.BOOST,
      effectType: EffectType.COIN_X2_NEXT_SESSION,
      rarity: Rarity.RARE,
      cost: 40,
      multiplier: 2,
      isTimed: false,
      minDurationHours: null,
      maxDurationHours: null,
      isActive: true,
    },
  });

  await prisma.shopProduct.upsert({
    where: { slug: "coin-boost-timed" },
    create: {
      slug: "coin-boost-timed",
      name: "Coin boost 1-5h",
      description: "Doubles coins for a random duration from 1 to 5 hours",
      type: ItemType.BOOST,
      effectType: EffectType.COIN_X2_TIMED,
      rarity: Rarity.EPIC,
      cost: 120,
      multiplier: 2,
      isTimed: true,
      minDurationHours: 1,
      maxDurationHours: 5,
      isActive: true,
    },
    update: {
      name: "Coin boost 1-5h",
      description: "Doubles coins for a random duration from 1 to 5 hours",
      type: ItemType.BOOST,
      effectType: EffectType.COIN_X2_TIMED,
      rarity: Rarity.EPIC,
      cost: 120,
      multiplier: 2,
      isTimed: true,
      minDurationHours: 1,
      maxDurationHours: 5,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
