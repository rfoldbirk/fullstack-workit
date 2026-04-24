import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../prisma";
import { getUserId } from "./me/utils";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    const muscleGroups = await prisma.muscle_group.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json(muscleGroups);
  } catch (error) {
    console.error("get muscle groups error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
