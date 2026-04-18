import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await prisma.token.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    const sessionToken = req.cookies.session;

    if (!sessionToken) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const tokens = await prisma.token.findMany({
      where: {
        expires: {
          gt: new Date(),
        },
      },
    });

    for (const tokenRow of tokens) {
      const matches = await bcrypt.compare(sessionToken, tokenRow.hash);

      if (matches) {
        req.user = { id: tokenRow.user_id };
        return next();
      }
    }

    return res.status(401).json({
      error: "Invalid session",
    });
  } catch (error) {
    console.error("auth middleware error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
