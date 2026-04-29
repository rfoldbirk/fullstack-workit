import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId } from "../me/utils";

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

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const coach = await requireCoach(userId, res);
    if (!coach) return;

    const relations = await prisma.user_to_coach.findMany({
      where: {
        coach_id: userId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
            date_of_birth: true,
            weight_kg: true,
            height_cm: true,
            _count: {
              select: {
                weight_logs: true,
                assigned_program_templates: true,
                program_log: true,
              },
            },
            assigned_program_templates: {
              select: {
                assigned_at: true,
                template: {
                  select: {
                    name: true,
                    description: true,
                  },
                },
              },
              orderBy: {
                assigned_at: "desc",
              },
              take: 1,
            },
            weight_logs: {
              select: {
                timestamp: true,
              },
              orderBy: {
                timestamp: "desc",
              },
              take: 1,
            },
            program_log: {
              select: {
                date: true,
              },
              orderBy: {
                date: "desc",
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        users: {
          name: "asc",
        },
      },
    });

    const clients = relations.map((relation) => {
      const latestWeightAt = relation.users.weight_logs[0]?.timestamp ?? null;
      const latestWorkoutAt = relation.users.program_log[0]?.date ?? null;
      const latestActivityAt = [latestWeightAt, latestWorkoutAt]
        .filter((value): value is Date => value instanceof Date)
        .sort((left, right) => right.getTime() - left.getTime())[0];

      const latestProgram = relation.users.assigned_program_templates[0];

      return {
        id: relation.users.id,
        name: relation.users.name,
        email: relation.users.email,
        picture: relation.users.picture,
        age: calculateAge(relation.users.date_of_birth),
        currentWeightKg: relation.users.weight_kg,
        heightCm: relation.users.height_cm,
        completedWorkouts: relation.users._count.program_log,
        weightLogCount: relation.users._count.weight_logs,
        assignedProgramCount: relation.users._count.assigned_program_templates,
        latestActivityAt: latestActivityAt?.toISOString() ?? null,
        latestProgram: latestProgram
          ? {
              title: latestProgram.template.name,
              description: latestProgram.template.description,
            }
          : null,
      };
    });

    return res.json({
      summary: {
        clientCount: clients.length,
        maxClients: coach.max_clients,
      },
      clients,
    });
  } catch (error) {
    console.error("get coach clients error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
