import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coaches = await prisma.coach.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
        _count: {
          select: {
            user_to_coach: true,
          },
        },
      },
      orderBy: {
        users: {
          name: "asc",
        },
      },
    });

    const result = coaches.map((coach) => {
      const currentClients = coach._count.user_to_coach;
      const remainingSlots =
        coach.max_clients === null
          ? null
          : Math.max(coach.max_clients - currentClients, 0);

      return {
        id: coach.user_id,
        name: coach.users.name,
        email: coach.users.email,
        picture: coach.users.picture,
        priceDkk: coach.price_dkk,
        currentClients,
        maxClients: coach.max_clients,
        remainingSlots,
      };
    });

    return res.json({
      summary: {
        totalCoaches: result.length,
      },
      coaches: result,
    });
  } catch (error) {
    console.error("get coaches error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
