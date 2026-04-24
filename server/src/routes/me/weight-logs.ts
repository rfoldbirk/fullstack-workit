import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseDate } from "./utils";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const weightLogs = await prisma.weight_logs.findMany({
      where: { user_id: userId },
      select: {
        timestamp: true,
        weight: true,
      },
      orderBy: { timestamp: "desc" },
    });

    return res.json(weightLogs);
  } catch (error) {
    console.error("get weight logs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const weight = req.body.weight === null ? null : Number(req.body.weight);

    if (req.body.weight !== null && Number.isNaN(weight)) {
      return res.status(400).json({ error: "Invalid weight" });
    }

    const timestamp = req.body.timestamp ? parseDate(req.body.timestamp) : undefined;

    if (req.body.timestamp && !timestamp) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }

    const weightLog = await prisma.weight_logs.create({
      data: {
        user_id: userId,
        weight,
        ...(timestamp ? { timestamp } : {}),
      },
    });

    return res.status(201).json(weightLog);
  } catch (error) {
    console.error("post weight log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:timestamp", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const timestamp = parseDate(req.params.timestamp);

    if (!timestamp) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }

    const weight = req.body.weight === null ? null : Number(req.body.weight);

    if (req.body.weight !== null && Number.isNaN(weight)) {
      return res.status(400).json({ error: "Invalid weight" });
    }

    const weightLog = await prisma.weight_logs.update({
      where: {
        user_id_timestamp: {
          user_id: userId,
          timestamp,
        },
      },
      data: { weight },
    });

    return res.json(weightLog);
  } catch (error) {
    console.error("patch weight log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:timestamp", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const timestamp = parseDate(req.params.timestamp);

    if (!timestamp) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }

    await prisma.weight_logs.delete({
      where: {
        user_id_timestamp: {
          user_id: userId,
          timestamp,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("delete weight log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
