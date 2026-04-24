import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseId } from "./utils";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const relation = await prisma.user_to_coach.findUnique({
      where: { user_id: userId },
      include: {
        coach: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
    });

    return res.json(relation?.coach ?? null);
  } catch (error) {
    console.error("get coach error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { priceDkk, maxClients } = req.body;

    const existingCoach = await prisma.coach.findUnique({
      where: { user_id: userId },
    });

    if (existingCoach) {
      return res.status(409).json({ error: "Already a coach" });
    }

    const coach = await prisma.coach.create({
      data: {
        user_id: userId,
        price_dkk: priceDkk,
        max_clients: maxClients,
      },
    });

    res.status(201).json(coach);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Could not create coach profile" });
  }
});

router.post("/:coachId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const coachId = parseId(req.params.coachId);

    if (!coachId) {
      return res.status(400).json({ error: "Invalid coachId" });
    }

    if (coachId === userId) {
      return res
        .status(400)
        .json({ error: "You cannot choose yourself as coach" });
    }

    const coach = await prisma.coach.findUnique({
      where: { user_id: coachId },
    });

    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }

    const relation = await prisma.user_to_coach.upsert({
      where: { user_id: userId },
      update: { coach_id: coachId },
      create: {
        user_id: userId,
        coach_id: coachId,
      },
      include: {
        coach: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json(relation.coach);
  } catch (error) {
    console.error("post coach error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    await prisma.$transaction([
      prisma.user_to_coach.deleteMany({
        where: { user_id: userId },
      }),

      prisma.coach.deleteMany({
        where: { user_id: userId },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("delete coach error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
