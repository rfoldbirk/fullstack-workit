import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../prisma";
import { parseId } from "./me/utils";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exercises = await prisma.exercise.findMany({});

    return res.json(exercises);
  } catch (error) {
    console.error("get exercises error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Invalid exercise id" });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    return res.json(exercise);
  } catch (error) {
    console.error("get exercise error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/:id/muscle-groups",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({ error: "Invalid exercise id" });
      }

      const exercise = await prisma.exercise.findUnique({
        where: { id },
        include: {
          exercise_to_muscle: {
            include: {
              muscle_group: true,
            },
          },
        },
      });

      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      const muscleGroups = exercise.exercise_to_muscle.map(
        (relation) => relation.muscle_group,
      );

      return res.json(muscleGroups);
    } catch (error) {
      console.error("get exercise muscle groups error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
