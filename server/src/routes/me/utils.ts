import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";

export function getUserId(
  req: AuthenticatedRequest,
  res: Response,
): number | null {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
}

export function parseId(value: string | string[] | undefined): number | null {
  if (!value || Array.isArray(value)) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
