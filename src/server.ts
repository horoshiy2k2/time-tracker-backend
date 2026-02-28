import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

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
  const current = await prisma.currentSession.findFirst();

  if (!current) {
    return res.status(400).json({ error: "No active session" });
  }

  const now = new Date();

  const durationSec = Math.floor(
    (now.getTime() - current.startTime.getTime()) / 1000
  );

  await prisma.session.create({
    data: {
      categoryId: current.categoryId,
      startTime: current.startTime,
      endTime: now,
      durationSec,
    },
  });

  await prisma.currentSession.delete({
    where: { id: current.id },
  });

  res.json({ success: true });
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

  const coins = Math.floor(totalSeconds / 3600);

  res.json({
    totalSeconds,
    coins,
  });
});

/* ---------- START SERVER ---------- */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});