import { Router, Response } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const meRouter = Router();

meRouter.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const fieldsQuery = req.query.fields;

      if (!fieldsQuery || typeof fieldsQuery !== "string") {
        return res.json(user);
      }

      const fields = fieldsQuery.split(",").map((field) => field.trim());

      const result: Record<string, unknown> = {};

      for (const field of fields) {
        if (field in user) {
          result[field] = user[field as keyof typeof user];
        }
      }

      return res.json(result);
    } catch (error) {
      console.error("me error:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

meRouter.get(
  "/weight-logs",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const weightLogs = await prisma.weight_logs.findMany({
        where: {
          user_id: userId,
        },
        select: {
          timestamp: true,
          weight: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      return res.json(weightLogs);
    } catch (error) {
      console.error("weight logs error:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

export default meRouter;
