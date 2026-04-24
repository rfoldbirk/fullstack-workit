import { Router, Response } from "express";
import { prisma } from "../../prisma";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth";
import { getUserId, parseDate } from "./utils";

import weightLogsRouter from "./weight-logs";
import programsRouter from "./programs";
import programLogsRouter from "./program-logs";
import coachRouter from "./coach";
import profilePictureRouter from "./profile-picture";
import programTemplatesRouter from "./program-templates";
import workoutLogsRouter from "./workout-logs";

const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
    console.error("get me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

meRouter.patch("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const updateData: {
      name?: string;
      date_of_birth?: Date | null;
      weight_kg?: number | null;
      height_cm?: number | null;
      gender?: "male" | "female" | null;
      picture?: string | null;
    } = {};

    if (typeof req.body.name === "string") {
      updateData.name = req.body.name.trim();
    }

    if ("date_of_birth" in req.body) {
      updateData.date_of_birth = req.body.date_of_birth
        ? parseDate(req.body.date_of_birth)
        : null;

      if (req.body.date_of_birth && !updateData.date_of_birth) {
        return res.status(400).json({ error: "Invalid date_of_birth" });
      }
    }

    if ("weight_kg" in req.body) {
      updateData.weight_kg =
        req.body.weight_kg === null ? null : Number(req.body.weight_kg);
    }

    if ("height_cm" in req.body) {
      updateData.height_cm =
        req.body.height_cm === null ? null : Number(req.body.height_cm);
    }

    if ("gender" in req.body) {
      if (
        req.body.gender !== null &&
        req.body.gender !== "male" &&
        req.body.gender !== "female"
      ) {
        return res.status(400).json({ error: "Invalid gender" });
      }

      updateData.gender = req.body.gender;
    }

    if ("picture" in req.body) {
      return res.status(400).json({
        error: "pictures should be added through PATCH /api/me/profile-picture",
      });
    }

    if (
      updateData.weight_kg !== undefined &&
      updateData.weight_kg !== null &&
      Number.isNaN(updateData.weight_kg)
    ) {
      return res.status(400).json({ error: "Invalid weight_kg" });
    }

    if (
      updateData.height_cm !== undefined &&
      updateData.height_cm !== null &&
      Number.isNaN(updateData.height_cm)
    ) {
      return res.status(400).json({ error: "Invalid height_cm" });
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    return res.json(user);
  } catch (error) {
    console.error("patch me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

meRouter.delete("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    await prisma.users.delete({
      where: { id: userId },
    });

    res.clearCookie("session");
    return res.status(204).send();
  } catch (error) {
    console.error("delete me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

meRouter.use("/weight-logs", weightLogsRouter);
meRouter.use("/programs", programsRouter);
meRouter.use("/program-logs", programLogsRouter);
meRouter.use("/coach", coachRouter);
meRouter.use("/profile-picture", profilePictureRouter);
meRouter.use("/program-templates", programTemplatesRouter);
meRouter.use("/workout-logs", workoutLogsRouter);

export default meRouter;
