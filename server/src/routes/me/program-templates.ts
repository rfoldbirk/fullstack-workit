import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseId } from "./utils";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const assignedTemplates = await prisma.user_program_template.findMany({
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
      },
      orderBy: {
        assigned_at: "desc",
      },
    });

    return res.json(assignedTemplates.map((entry) => entry.template));
  } catch (error) {
    console.error("get my program templates error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:templateId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const templateId = parseId(req.params.templateId);

    if (!templateId) {
      return res.status(400).json({ error: "Invalid templateId" });
    }

    const assignedTemplate = await prisma.user_program_template.findUnique({
      where: {
        user_id_template_id: {
          user_id: userId,
          template_id: templateId,
        },
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
      },
    });

    if (!assignedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json(assignedTemplate.template);
  } catch (error) {
    console.error("get my program template error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
