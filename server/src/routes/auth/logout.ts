import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../prisma";

const logoutRouter = Router();

const SESSION_COOKIE_NAME = "session";

logoutRouter.post("/", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
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
          await prisma.token.deleteMany({
            where: {
              user_id: tokenRow.user_id,
            },
          });
          break;
        }
      }
    }

    res.clearCookie(SESSION_COOKIE_NAME);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("signout error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default logoutRouter;
