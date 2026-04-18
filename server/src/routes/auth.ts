import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

const authRouter = Router();

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function hashSessionToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

async function verifySessionToken(
  token: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

function getSessionExpiryDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  return expires;
}

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await prisma.users.findUnique({
      where: { email },
      include: { password: true },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password.hash);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const rawSessionToken = generateSessionToken();
    const hashedSessionToken = await hashSessionToken(rawSessionToken);
    const expires = getSessionExpiryDate();

    await prisma.token.deleteMany({
      where: {
        user_id: user.id,
      },
    });

    await prisma.token.create({
      data: {
        hash: hashedSessionToken,
        user_id: user.id,
        expires,
      },
    });

    res.cookie("session", rawSessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.session;

    if (sessionToken) {
      const tokens = await prisma.token.findMany({
        where: {
          expires: {
            gt: new Date(),
          },
        },
      });

      for (const tokenRow of tokens) {
        const matches = await verifySessionToken(sessionToken, tokenRow.hash);

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

    res.clearCookie("session");

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default authRouter;
