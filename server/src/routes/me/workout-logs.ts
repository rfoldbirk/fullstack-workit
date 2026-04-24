import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseId, parseDate } from "./utils";

const router = Router();

async function userHasTemplate(userId: number, templateId: number) {
  return prisma.user_program_template.findUnique({
    where: {
      user_id_template_id: {
        user_id: userId,
        template_id: templateId,
      },
    },
  });
}

async function userOwnsWorkoutLog(userId: number, logId: number) {
  return prisma.program_log.findFirst({
    where: {
      id: logId,
      user_id: userId,
    },
  });
}

router.post("/start", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const templateId = parseId(String(req.body.template_id));
    const date = req.body.date ? parseDate(req.body.date) : new Date();

    if (!templateId) {
      return res.status(400).json({ error: "Invalid template_id" });
    }

    if (!date) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const assignedTemplate = await userHasTemplate(userId, templateId);

    if (!assignedTemplate) {
      return res.status(403).json({
        error: "You do not have access to this template",
      });
    }

    const workoutLog = await prisma.program_log.create({
      data: {
        user_id: userId,
        template_id: templateId,
        date,
        note:
          typeof req.body.note === "string" && req.body.note.trim() !== ""
            ? req.body.note.trim()
            : null,
      },
      include: {
        template: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: {
                order_nr: "asc",
              },
            },
          },
        },
        exercise_log: {
          include: {
            exercise: true,
          },
          orderBy: [
            {
              exercise_id: "asc",
            },
            {
              set_nr: "asc",
            },
          ],
        },
      },
    });

    return res.status(201).json(workoutLog);
  } catch (error) {
    console.error("start workout log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const workoutLogs = await prisma.program_log.findMany({
      where: {
        user_id: userId,
      },
      include: {
        template: {
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
        exercise_log: {
          include: {
            exercise: true,
          },
          orderBy: [
            {
              exercise_id: "asc",
            },
            {
              set_nr: "asc",
            },
          ],
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return res.json(workoutLogs);
  } catch (error) {
    console.error("get workout logs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:logId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const logId = parseId(req.params.logId);

    if (!logId) {
      return res.status(400).json({ error: "Invalid logId" });
    }

    const workoutLog = await prisma.program_log.findFirst({
      where: {
        id: logId,
        user_id: userId,
      },
      include: {
        template: {
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: {
                order_nr: "asc",
              },
            },
          },
        },
        exercise_log: {
          include: {
            exercise: true,
          },
          orderBy: [
            {
              exercise_id: "asc",
            },
            {
              set_nr: "asc",
            },
          ],
        },
      },
    });

    if (!workoutLog) {
      return res.status(404).json({ error: "Workout log not found" });
    }

    return res.json(workoutLog);
  } catch (error) {
    console.error("get workout log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch(
  "/:logId/finish",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const logId = parseId(req.params.logId);

      if (!logId) {
        return res.status(400).json({ error: "Invalid logId" });
      }

      const existingLog = await userOwnsWorkoutLog(userId, logId);

      if (!existingLog) {
        return res.status(404).json({ error: "Workout log not found" });
      }

      const workoutLog = await prisma.program_log.update({
        where: {
          id: logId,
        },
        data: {
          note:
            typeof req.body.note === "string" && req.body.note.trim() !== ""
              ? req.body.note.trim()
              : existingLog.note,
        },
        include: {
          template: true,
          exercise_log: {
            include: {
              exercise: true,
            },
            orderBy: [
              {
                exercise_id: "asc",
              },
              {
                set_nr: "asc",
              },
            ],
          },
        },
      });

      return res.json(workoutLog);
    } catch (error) {
      console.error("finish workout log error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete("/:logId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const logId = parseId(req.params.logId);

    if (!logId) {
      return res.status(400).json({ error: "Invalid logId" });
    }

    const existingLog = await userOwnsWorkoutLog(userId, logId);

    if (!existingLog) {
      return res.status(404).json({ error: "Workout log not found" });
    }

    await prisma.program_log.delete({
      where: {
        id: logId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("delete workout log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/:logId/exercise-logs",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const logId = parseId(req.params.logId);
      const exerciseId = parseId(String(req.body.exercise_id));
      const setNr = Number(req.body.set_nr);
      const reps = Number(req.body.reps);
      const kg = Number(req.body.kg);

      if (!logId) {
        return res.status(400).json({ error: "Invalid logId" });
      }

      if (!exerciseId) {
        return res.status(400).json({ error: "Invalid exercise_id" });
      }

      if (!Number.isInteger(setNr) || setNr <= 0) {
        return res.status(400).json({ error: "Invalid set_nr" });
      }

      if (!Number.isInteger(reps) || reps < 0) {
        return res.status(400).json({ error: "Invalid reps" });
      }

      if (!Number.isFinite(kg) || kg < 0) {
        return res.status(400).json({ error: "Invalid kg" });
      }

      const workoutLog = await prisma.program_log.findFirst({
        where: {
          id: logId,
          user_id: userId,
        },
        include: {
          template: {
            include: {
              exercises: {
                select: {
                  exercise_id: true,
                },
              },
            },
          },
        },
      });

      if (!workoutLog) {
        return res.status(404).json({ error: "Workout log not found" });
      }

      const exerciseIsInTemplate =
        workoutLog.template?.exercises?.some(
          (templateExercise) =>
            templateExercise && templateExercise.exercise_id === exerciseId,
        ) ?? false;

      if (!exerciseIsInTemplate) {
        return res.status(400).json({
          error: "Exercise is not part of this workout template",
        });
      }

      const exerciseLog = await prisma.exercise_log.create({
        data: {
          program_log_id: logId,
          exercise_id: exerciseId,
          set_nr: setNr,
          reps,
          kg,
        },
        include: {
          exercise: true,
        },
      });

      return res.status(201).json(exerciseLog);
    } catch (error) {
      console.error("create exercise log error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.patch(
  "/:logId/exercise-logs/:exerciseLogId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const logId = parseId(req.params.logId);
      const exerciseLogId = parseId(req.params.exerciseLogId);

      if (!logId || !exerciseLogId) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const workoutLog = await userOwnsWorkoutLog(userId, logId);

      if (!workoutLog) {
        return res.status(404).json({ error: "Workout log not found" });
      }

      const existingExerciseLog = await prisma.exercise_log.findFirst({
        where: {
          id: exerciseLogId,
          program_log_id: logId,
        },
      });

      if (!existingExerciseLog) {
        return res.status(404).json({ error: "Exercise log not found" });
      }

      let setNr: number | undefined;
      let reps: number | undefined;
      let kg: number | undefined;

      if (req.body.set_nr !== undefined) {
        const parsed = Number(req.body.set_nr);

        if (!Number.isInteger(parsed) || parsed <= 0) {
          return res.status(400).json({ error: "Invalid set_nr" });
        }

        setNr = parsed;
      }

      if (req.body.reps !== undefined) {
        const parsed = Number(req.body.reps);

        if (!Number.isInteger(parsed) || parsed < 0) {
          return res.status(400).json({ error: "Invalid reps" });
        }

        reps = parsed;
      }

      if (req.body.kg !== undefined) {
        const parsed = Number(req.body.kg);

        if (!Number.isFinite(parsed) || parsed < 0) {
          return res.status(400).json({ error: "Invalid kg" });
        }

        kg = parsed;
      }

      const updatedExerciseLog = await prisma.exercise_log.update({
        where: { id: exerciseLogId },
        data: {
          ...(setNr !== undefined && { set_nr: setNr }),
          ...(reps !== undefined && { reps }),
          ...(kg !== undefined && { kg }),
        },
      });

      return res.json(updatedExerciseLog);
    } catch (error) {
      console.error("update exercise log error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:logId/exercise-logs/:exerciseLogId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const logId = parseId(req.params.logId);
      const exerciseLogId = parseId(req.params.exerciseLogId);

      if (!logId || !exerciseLogId) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const workoutLog = await userOwnsWorkoutLog(userId, logId);

      if (!workoutLog) {
        return res.status(404).json({ error: "Workout log not found" });
      }

      await prisma.exercise_log.deleteMany({
        where: {
          id: exerciseLogId,
          program_log_id: logId,
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("delete exercise log error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
