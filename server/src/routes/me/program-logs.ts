import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseDate, parseId } from "./utils";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const programLogs = await prisma.program_log.findMany({
      where: { user_id: userId },
      include: {
        program: true,
      },
      orderBy: { date: "desc" },
    });

    return res.json(programLogs);
  } catch (error) {
    console.error("get program logs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const programId = parseId(String(req.body.program_id));

    if (!programId) {
      return res.status(400).json({ error: "Invalid program_id" });
    }

    const ownsProgram = await prisma.users_program.findUnique({
      where: {
        program_id_user_id: {
          program_id: programId,
          user_id: userId,
        },
      },
    });

    if (!ownsProgram) {
      return res.status(404).json({ error: "Program not found for user" });
    }

    const date = req.body.date ? parseDate(req.body.date) : undefined;

    if (req.body.date && !date) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const programLog = await prisma.program_log.create({
      data: {
        user_id: userId,
        program_id: programId,
        ...(date ? { date } : {}),
      },
      include: {
        program: true,
      },
    });

    return res.status(201).json(programLog);
  } catch (error) {
    console.error("post program log error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
