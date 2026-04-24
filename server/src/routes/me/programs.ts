import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId } from "./utils";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const userPrograms = await prisma.users_program.findMany({
      where: { user_id: userId },
      include: {
        program: {
          include: {
            exercise_order: {
              orderBy: { order_nr: "asc" },
              include: {
                exercise: true,
              },
            },
          },
        },
      },
    });

    return res.json(userPrograms.map((userProgram) => userProgram.program));
  } catch (error) {
    console.error("get me programs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
