import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseId } from "../me/utils";

const router = Router();

async function requireCoach(userId: number, res: Response) {
  const coach = await prisma.coach.findUnique({
    where: { user_id: userId },
  });

  if (!coach) {
    res.status(403).json({ error: "Only coaches can use this endpoint" });
    return null;
  }

  return coach;
}

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const coach = await requireCoach(userId, res);
    if (!coach) return;

    const templates = await prisma.program_template.findMany({
      where: { coach_id: userId },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order_nr: "asc",
          },
        },
        assignments: {
          include: {
            user: {
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
      orderBy: {
        created_at: "desc",
      },
    });

    return res.json(templates);
  } catch (error) {
    console.error("get coach templates error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const coach = await requireCoach(userId, res);
    if (!coach) return;

    const { name, description } = req.body;

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    const template = await prisma.program_template.create({
      data: {
        coach_id: userId,
        name: name.trim(),
        description:
          typeof description === "string" && description.trim() !== ""
            ? description.trim()
            : null,
      },
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error("create coach template error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:templateId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const coach = await requireCoach(userId, res);
    if (!coach) return;

    const templateId = parseId(req.params.templateId);

    if (!templateId) {
      return res.status(400).json({ error: "Invalid templateId" });
    }

    const template = await prisma.program_template.findFirst({
      where: {
        id: templateId,
        coach_id: userId,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order_nr: "asc",
          },
        },
        assignments: {
          include: {
            user: {
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

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json(template);
  } catch (error) {
    console.error("get coach template error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch(
  "/:templateId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const coach = await requireCoach(userId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);

      if (!templateId) {
        return res.status(400).json({ error: "Invalid templateId" });
      }

      const existing = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: userId,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }

      const { name, description } = req.body;

      const template = await prisma.program_template.update({
        where: { id: templateId },
        data: {
          ...(typeof name === "string" && name.trim() !== ""
            ? { name: name.trim() }
            : {}),
          ...(description !== undefined
            ? {
                description:
                  typeof description === "string" && description.trim() !== ""
                    ? description.trim()
                    : null,
              }
            : {}),
        },
      });

      return res.json(template);
    } catch (error) {
      console.error("update coach template error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:templateId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const coach = await requireCoach(userId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);

      if (!templateId) {
        return res.status(400).json({ error: "Invalid templateId" });
      }

      const existing = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: userId,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }

      await prisma.program_template.delete({
        where: { id: templateId },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("delete coach template error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/:templateId/exercises",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const coach = await requireCoach(userId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);
      const exerciseId = parseId(String(req.body.exercise_id));
      const orderNr = Number(req.body.order_nr);
      const restTimer =
        req.body.rest_timer !== undefined
          ? Number(req.body.rest_timer)
          : undefined;

      if (!templateId) {
        return res.status(400).json({ error: "Invalid templateId" });
      }

      if (!exerciseId) {
        return res.status(400).json({ error: "Invalid exercise_id" });
      }

      if (!Number.isInteger(orderNr) || orderNr <= 0) {
        return res.status(400).json({ error: "Invalid order_nr" });
      }

      if (
        restTimer !== undefined &&
        (!Number.isInteger(restTimer) || restTimer < 0)
      ) {
        return res.status(400).json({ error: "Invalid rest_timer" });
      }

      const template = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: userId,
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const exercise = await prisma.exercise.findUnique({
        where: { id: exerciseId },
      });

      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      const templateExercise = await prisma.program_template_exercise.create({
        data: {
          template_id: templateId,
          exercise_id: exerciseId,
          order_nr: orderNr,
          ...(restTimer !== undefined ? { rest_timer: restTimer } : {}),
        },
        include: {
          exercise: true,
        },
      });

      return res.status(201).json(templateExercise);
    } catch (error) {
      console.error("add template exercise error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.patch(
  "/:templateId/exercises/:templateExerciseId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const coach = await requireCoach(userId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);
      const templateExerciseId = parseId(req.params.templateExerciseId);

      if (!templateId || !templateExerciseId) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const template = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: userId,
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const existing = await prisma.program_template_exercise.findFirst({
        where: {
          id: templateExerciseId,
          template_id: templateId,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Template exercise not found" });
      }

      const data: {
        exercise_id?: number;
        order_nr?: number;
        rest_timer?: number;
      } = {};

      if (req.body.exercise_id !== undefined) {
        const exerciseId = parseId(String(req.body.exercise_id));

        if (!exerciseId) {
          return res.status(400).json({ error: "Invalid exercise_id" });
        }

        const exercise = await prisma.exercise.findUnique({
          where: { id: exerciseId },
        });

        if (!exercise) {
          return res.status(404).json({ error: "Exercise not found" });
        }

        data.exercise_id = exerciseId;
      }

      if (req.body.order_nr !== undefined) {
        const orderNr = Number(req.body.order_nr);

        if (!Number.isInteger(orderNr) || orderNr <= 0) {
          return res.status(400).json({ error: "Invalid order_nr" });
        }

        data.order_nr = orderNr;
      }

      if (req.body.rest_timer !== undefined) {
        const restTimer = Number(req.body.rest_timer);

        if (!Number.isInteger(restTimer) || restTimer < 0) {
          return res.status(400).json({ error: "Invalid rest_timer" });
        }

        data.rest_timer = restTimer;
      }

      const updated = await prisma.program_template_exercise.update({
        where: { id: templateExerciseId },
        data,
        include: {
          exercise: true,
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error("update template exercise error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:templateId/exercises/:templateExerciseId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return;

      const coach = await requireCoach(userId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);
      const templateExerciseId = parseId(req.params.templateExerciseId);

      if (!templateId || !templateExerciseId) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const template = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: userId,
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      await prisma.program_template_exercise.deleteMany({
        where: {
          id: templateExerciseId,
          template_id: templateId,
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("delete template exercise error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/:templateId/assign/:userId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const coachId = getUserId(req, res);
      if (!coachId) return;

      const coach = await requireCoach(coachId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);
      const clientId = parseId(req.params.userId);

      if (!templateId || !clientId) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const template = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: coachId,
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const clientRelation = await prisma.user_to_coach.findFirst({
        where: {
          user_id: clientId,
          coach_id: coachId,
        },
      });

      if (!clientRelation) {
        return res.status(403).json({
          error: "You can only assign templates to your own clients",
        });
      }

      const assignment = await prisma.user_program_template.upsert({
        where: {
          user_id_template_id: {
            user_id: clientId,
            template_id: templateId,
          },
        },
        update: {},
        create: {
          user_id: clientId,
          template_id: templateId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              picture: true,
            },
          },
          template: true,
        },
      });

      return res.status(201).json(assignment);
    } catch (error) {
      console.error("assign template error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:templateId/assign/:userId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const coachId = getUserId(req, res);
      if (!coachId) return;

      const coach = await requireCoach(coachId, res);
      if (!coach) return;

      const templateId = parseId(req.params.templateId);
      const clientId = parseId(req.params.userId);

      if (!templateId || !clientId) {
        return res.status(400).json({ error: "Invalid id" });
      }

      const template = await prisma.program_template.findFirst({
        where: {
          id: templateId,
          coach_id: coachId,
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      await prisma.user_program_template.deleteMany({
        where: {
          user_id: clientId,
          template_id: templateId,
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("unassign template error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
