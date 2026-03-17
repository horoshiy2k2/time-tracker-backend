import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient, Rarity } from "@prisma/client";
import { CHEST_SETTINGS, DROP_RANGES } from "./lootConfig";


const prisma = new PrismaClient();
const app = express();


const CHEST_COST: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 25,
  RARE: 50,
  EPIC: 100,
  LEGENDARY: 200,
};

const COLOR_DROP_COST: Record<string, number> = {
  COMMON: 2,
  UNCOMMON: 4,
  RARE: 8,
  EPIC: 16,
  LEGENDARY: 32,
};

//const COLOR_COST = 3;



app.use(cors());
app.use(express.json());

/* ---------- CATEGORIES ---------- */

app.get("/categories", async (_, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  const category = await prisma.category.create({
    data: { name },
  });
  res.json(category);
});

app.put("/categories/:id", async (req, res) => {
  try {
    const { name } = req.body;

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Category not found" });
  }
});

app.delete("/categories/:id", async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { categoryId: req.params.id },
    });

    if (sessions.length > 0) {
      return res.status(400).json({
        error: "Cannot delete category with existing sessions",
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Category not found" });
  }
});

/* ---------- SESSIONS ---------- */

app.get("/sessions", async (_, res) => {
  const sessions = await prisma.session.findMany({
    include: { category: true },
    orderBy: { startTime: "desc" },
  });
  res.json(sessions);
});

app.get("/current-session", async (req, res) => {
  const session = await prisma.currentSession.findFirst({
    include: { category: true },
  });
  res.json(session);
});

app.post("/current-session/start", async (req, res) => {
  const { categoryId } = req.body;

  const existing = await prisma.currentSession.findFirst();
  if (existing) {
    return res.status(400).json({ error: "Session already running" });
  }

  const session = await prisma.currentSession.create({
    data: {
      categoryId: categoryId || null,
      startTime: new Date(),
    },
  });

  res.json(session);
});

app.post("/current-session/stop", async (req, res) => {
  try {
    const current = await prisma.currentSession.findFirst();

    if (!current) {
      return res.status(400).json({ error: "No active session" });
    }

    const now = new Date();

    const durationSec = Math.floor(
      (now.getTime() - current.startTime.getTime()) / 1000
    );

    // Создаём полноценную сессию
    await prisma.session.create({
      data: {
        categoryId: current.categoryId,
        startTime: current.startTime,
        endTime: now,
        durationSec,
      },
    });

    // Удаляем текущую сессию
    await prisma.currentSession.delete({
      where: { id: current.id },
    });

    // Берём пользователя
    const user = await prisma.user.findFirst();
    if (!user) return res.status(400).json({ error: "User not found" });

    // Начисляем монеты (целые числа)
    const coinsEarned = Math.floor(durationSec / 600);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: coinsEarned } },
    });

    res.json({
      success: true,
      durationSec,
      coinsEarned,
      coinsTotal: updatedUser.coins,
    });

  } catch (err:any) {
    console.error("Stop session error:", err);
    res.status(500).json({ error: "Failed to stop session", details: err.message });
  }
});

app.delete("/sessions/:id", async (req, res) => {
  await prisma.session.delete({
    where: { id: req.params.id },
  });
  res.json({ success: true });
});

app.put("/sessions/:id", async (req, res) => {
  try {
    const { durationMin, categoryId, startTime } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const durationSec =
      durationMin !== undefined
        ? Math.round(durationMin * 60)
        : session.durationSec;

    const newStartTime = startTime ? new Date(startTime) : session.startTime;
    const newEndTime = new Date(newStartTime.getTime() + durationSec * 1000);

    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        durationSec,
        startTime: newStartTime,
        endTime: newEndTime,
        categoryId: categoryId ?? null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Session update failed" });
  }
});

/* ---------- STATS ---------- */

app.get("/stats", async (_, res) => {
  const sessions = await prisma.session.findMany();

  // Явно указываем, что sessions — массив объектов с durationSec
  const totalSeconds = sessions.reduce((acc: number, s: { durationSec: number }) => {
    return acc + s.durationSec;
  }, 0);

  res.json({
    totalSeconds
  });
});

/* ---------- INVENTORY ---------- */

app.get("/inventory", async (_, res) => {
  const chests = await prisma.chest.findMany({
    where: { isInInventory: true }
  });

  const colorDrops = await prisma.colorDrop.findMany({
    where: { isInInventory: true }
  });

  const colors = await prisma.color.findMany({
    where: { isInInventory: true }
  });

  res.json({
    chests,
    colorDrops,
    colors
  });
});


//* ---------- SHOP ---------- */

app.post("/shop/buy-chest", async (req, res) => {
  try {
    const { rarity } = req.body;

    const cost = CHEST_COST[rarity];

    if (!cost) {
      return res.status(400).json({ error: "Invalid rarity" });
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { coins: 0 } });
    }

    if (user.coins < cost) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    // Генерация сундука при покупке
    const chest = await prisma.chest.create({
      data: {
        name: `${rarity} Chest`,
        description: `A ${rarity.toLowerCase()} chest, opens to random items`,
        cost,
        rarity,
        type: "CHEST",      // если у тебя есть enum ItemType
        isInInventory: true
      }
    });

    // Снимаем монеты
    await prisma.user.update({
      where: { id: user.id },
      data: {
        coins: { decrement: cost }
      }
    });

    res.json(chest);
  } catch (error) {
    console.error(error);  // чтобы видеть в консоли причину 500
    res.status(500).json({ error: "Purchase failed" });
  }
});





/* ---------- COLOR MIX ---------- */

// POST /inventory/color/mix
app.post("/inventory/color/mix", async (req, res) => {
  try {
    const { dropIds } = req.body;

    if (!dropIds || dropIds.length !== 3) {
      return res.status(400).json({ error: "Need exactly 3 drops" });
    }

    const drops = await prisma.colorDrop.findMany({
      where: {
        id: { in: dropIds },
        isInInventory: true
      }
    });

    if (drops.length !== 3) {
      return res.status(400).json({ error: "Some drops not found" });
    }

    // Суммируем RGB по каналам, максимум 255
    const r = Math.min(255, drops[0].r + drops[1].r + drops[2].r);
    const g = Math.min(255, drops[0].g + drops[1].g + drops[2].g);
    const b = Math.min(255, drops[0].b + drops[1].b + drops[2].b);

    // Можно динамически вычислять rarity по сумме
    const paintAmount = r + g + b; // диапазон 0..765
    let rarity = "COMMON";
    if (paintAmount <= 153) rarity = "COMMON";
    else if (paintAmount <= 306) rarity = "UNCOMMON";
    else if (paintAmount <= 459) rarity = "RARE";
    else if (paintAmount <= 612) rarity = "EPIC";
    else rarity = "LEGENDARY";

    const colorCost = (COLOR_DROP_COST[rarity] || 1) * 3;


    const rarityEnum: Rarity = rarity as Rarity; // приводим к enum
    // Создаём новый цвет
    const color = await prisma.color.create({
      data: {
        name: "Color",
        description: "Created from 3 color drops",
        rarity: rarityEnum,
        cost: colorCost,
        type: "COLOR",
        r,
        g,
        b,
        isInInventory: true
      }
    });

    // Убираем использованные дропы из инвентаря
    await prisma.colorDrop.updateMany({
      where: { id: { in: dropIds } },
      data: { isInInventory: false }
    });

    res.json(color);

  } catch (err: any) {
    console.error("Color mix failed:", err);
    res.status(500).json({ error: "Color mix failed", details: err.message });
  }
});

/* ---------- USER ---------- */

app.get("/user", async (_, res) => {
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        coins: 0
      }
    });
  }

  res.json(user);
});


// POST /user/change-coins
// body: { amount: number }
app.post("/user/change-coins", async (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number") {
    return res.status(400).json({ error: "Amount must be a number" });
  }

  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({ data: { coins: 0 } });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      coins: { increment: amount }
    }
  });

  res.json(updatedUser);
});





/* ---------- CHEST OPEN ---------- */

app.post("/inventory/chest/open/:id", async (req, res) => {

  const chest = await prisma.chest.findUnique({
    where:{ id:req.params.id }
  });

  if(!chest || !chest.isInInventory){
    return res.status(400).json({error:"Chest not in inventory"});
  }

  const settings = CHEST_SETTINGS[chest.rarity];

  if(!settings){
    return res.status(400).json({error:"Unknown chest rarity"});
  }

  const [minItems,maxItems] = settings.items;

  const itemsCount =
    Math.floor(Math.random()*(maxItems-minItems+1))+minItems;

  const rewards:any[]=[];

  for(let i=0;i<itemsCount;i++){

    const rewardType = rollFromTable(settings.lootTable);

    /* ---------- COLOR DROP ---------- */

    if(rewardType==="colorDrop"){

      const rarityPool = settings.allowedDropRarities;

      const rarity =
        rarityPool[Math.floor(Math.random()*rarityPool.length)];

      const [min, max] = DROP_RANGES[rarity as keyof typeof DROP_RANGES]!;
      const value = Math.floor(Math.random() * (max - min + 1)) + min;

      const channel =
        ["r","g","b"][Math.floor(Math.random()*3)];

      const r = channel==="r"?value:0;
      const g = channel==="g"?value:0;
      const b = channel==="b"?value:0;

      const cost = COLOR_DROP_COST[rarity] || 1;


      const rarityEnum: Rarity = rarity as Rarity;

      const drop = await prisma.colorDrop.create({
        data:{
          name:"Color Drop",
          description:"Generated from chest",
          rarity: rarityEnum,
          cost:cost,
          type:"COLOR_DROP",
          r,g,b,
          isInInventory:true
        }
      });

      rewards.push({
        ...drop,
        itemType:"colorDrop"
      });
    }

    /* ---------- COLOR ---------- */

    if(rewardType === "color") {

      const rarityPool = settings.allowedDropRarities; // массив допустимых редкостей

      // случайная редкость
      let rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];

      // диапазон суммы каналов для редкости
      const [minTotal, maxTotal] = DROP_RANGES[rarity]; // например [0,153] для COMMON

      
      const r = Math.floor(Math.random() * (maxTotal - minTotal + 1)) + minTotal;
      const g = Math.floor(Math.random() * (maxTotal - minTotal + 1)) + minTotal;
      const b = Math.floor(Math.random() * (maxTotal - minTotal + 1)) + minTotal;

      // на всякий случай корректируем, чтобы не выходило за 0-255
      const clamp = (x: number) => Math.max(0, Math.min(255, x));
      const rClamped = clamp(r);
      const gClamped = clamp(g);
      const bClamped = clamp(b);


      // Считаем сумму каналов
      const paintAmount = r + g + b; // диапазон 0..765
    
      if (paintAmount <= 153) rarity = "COMMON";
      else if (paintAmount <= 306) rarity = "UNCOMMON";
      else if (paintAmount <= 459) rarity = "RARE";
      else if (paintAmount <= 612) rarity = "EPIC";
      else rarity = "LEGENDARY";


      const colorCost = (COLOR_DROP_COST[rarity] || 1) * 3;



      const rarityEnum: Rarity = rarity as Rarity; // приводим к enum

      const color = await prisma.color.create({
        data:{
          name:"Color",
          description:"Color for paint something",
          rarity:rarityEnum,
          cost: colorCost,
          type:"COLOR",
          r: rClamped,
          g: gClamped,
          b: bClamped,
          isInInventory:true
        }
      });

      rewards.push({
        ...color,
        itemType:"color"
      });
    }

    /* ---------- CHEST ---------- */

    if(rewardType==="chest"){

      const chestPool=[
        "COMMON",
        "UNCOMMON",
        "RARE"
      ];

      const rarity =
        chestPool[Math.floor(Math.random()*chestPool.length)];

      const rarityEnum: Rarity = rarity as Rarity; // приводим к enum
      
      const newChest = await prisma.chest.create({
        data:{
          name:`${rarity} Chest`,
          description:"Found inside another chest",
          rarity: rarityEnum,
          cost:CHEST_COST[rarity],
          type:"CHEST",
          isInInventory:true
        }
      });

      rewards.push({
        ...newChest,
        itemType:"chest"
      });
    }

  }

  await prisma.chest.update({
    where:{id:chest.id},
    data:{isInInventory:false}
  });

  res.json({
    rewards
  });

});



app.post("/inventory/sell-item/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sellValue } = req.body;



    if (!id || sellValue === undefined) {
      return res.status(400).json({ error: "Missing item id or sell value" });
    }

    const user = await prisma.user.findFirst();
    if (!user) return res.status(400).json({ error: "User not found" });

    // Попробуем найти предмет в каждой модели
    let item: any = await prisma.chest.findUnique({ where: { id } });
    let itemType: "chest" | "colorDrop" | "color" = "chest";

    if (!item) {
      item = await prisma.colorDrop.findUnique({ where: { id } });
      itemType = "colorDrop";
    }
    if (!item) {
      item = await prisma.color.findUnique({ where: { id } });
      itemType = "color";
    }

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (!item.isInInventory) return res.status(400).json({ error: "Item is not in inventory" });

    // Снимаем предмет с инвентаря
    if (itemType === "chest") {
      await prisma.chest.update({ where: { id }, data: { isInInventory: false } });
    } else if (itemType === "colorDrop") {
      await prisma.colorDrop.update({ where: { id }, data: { isInInventory: false } });
    } else if (itemType === "color") {
      await prisma.color.update({ where: { id }, data: { isInInventory: false } });
    }

    // Добавляем монеты пользователю только если sellValue > 0
    let coinsAdded = 0;
    if (sellValue > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { coins: { increment: sellValue } },
      });
      coinsAdded = sellValue;
      return res.json({
        message: "Item sold",
        coinsAdded,
        coinsTotal: updatedUser.coins,
      });
    }

    // Если sellValue === 0, возвращаем просто успешный результат
    return res.json({
      message: "Item removed from inventory",
      coinsAdded: 0,
      coinsTotal: user.coins,
    });

  } catch (err: any) {
    console.error("Sell item error:", err);
    res.status(500).json({ error: "Sell failed", details: err.message });
  }
});


/* ---------- PAINT ---------- */

app.post("/user/paint", async (req, res) => {
  try {
    const { colorId, target } = req.body;

    const user = await prisma.user.findFirst();
    if (!user) return res.status(400).json({ error: "User not found" });

    /* ---------- RESET THEME ---------- */

    if (target === "reset") {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          progressColor: "#646cff",
          textColor: "#000000",
          buttonColor: "#646cff",
          backgroundColor: "#ffffff"
        }
      });

      return res.json({
        message: "Theme reset",
        user: updated
      });
    }

    /* ---------- NIGHT MODE ---------- */

    if (target === "night") {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          backgroundColor: "#0f1115",
          textColor: "#e6e6e6",
        }
      });

      return res.json({
        message: "Night mode background applied",
        user: updated
      });
    }

    /* ---------- PAINT COLOR ---------- */

    const color = await prisma.color.findUnique({
      where: { id: colorId }
    });

    if (!color) {
      return res.status(404).json({ error: "Color not found" });
    }

    const hex =
      "#" +
      [color.r, color.g, color.b]
        .map(v => v.toString(16).padStart(2, "0"))
        .join("");

    let data: any = {};

    if (target === "progress") data.progressColor = hex;
    if (target === "text") data.textColor = hex;
    if (target === "buttons") data.buttonColor = hex;
    if (target === "background") data.backgroundColor = hex;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data
    });

    res.json({
      message: "Paint applied",
      target,
      color: hex,
      user: updated
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Paint failed", details: err.message });
  }
});

app.get("/user/theme", async (req, res) => {
  const user = await prisma.user.findFirst();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    progressColor: user.progressColor,
    textColor: user.textColor,
    buttonColor: user.buttonColor,
    backgroundColor: user.backgroundColor
  });
});


// DELETE /inventory/clear-db
app.delete("/inventory/clear-db", async (req, res) => {
  try {
    // Находим все предметы, которые **не принадлежат пользователю** (если есть связь userId)
    // Если у тебя нет userId у предметов, можно просто удалить все предметы
    await prisma.chest.deleteMany({ where: { isInInventory: false } });
    await prisma.color.deleteMany({ where: { isInInventory: false } });
    await prisma.colorDrop.deleteMany({ where: { isInInventory: false } });

    res.json({ message: "Database cleared of non-inventory items" });
  } catch (err) {
    console.error("Failed to clear DB:", err);
    res.status(500).json({ error: "Failed to clear DB" });
  }
});


/* ---------- START SERVER ---------- */

const PORT = process.env.PORT || 4000;

async function startServer() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Create .env from .env.example before starting backend.');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();


function rollFromTable(table: Record<string, number>): string {
  const entries = Object.entries(table) as [string, number][];

  const total = entries.reduce((a, [, v]) => a + v, 0);

  const roll = Math.random() * total;

  let acc = 0;

  for (const [key, value] of entries) {
    acc += value;
    if (roll <= acc) {
      return key;
    }
  }

  return entries[0][0];
}


