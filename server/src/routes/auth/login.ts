import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../prisma";
import { normalizeEmail } from "./otp";

const loginRouter = Router();

const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_DAYS = 7;

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function sessionExpiryFromNow(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_TTL_DAYS);
  return expires;
}

function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax" as const,
    expires,
  };
}

loginRouter.post("/", async (req: Request, res: Response) => {
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

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.users.findFirst({
      where: { email: normalizedEmail },
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
    const hashedSessionToken = await bcrypt.hash(rawSessionToken, 10);
    const expires = sessionExpiryFromNow();

    await prisma.token.deleteMany({
      where: { user_id: user.id },
    });

    await prisma.token.create({
      data: {
        hash: hashedSessionToken,
        user_id: user.id,
        expires,
      },
    });

    res.cookie(
      SESSION_COOKIE_NAME,
      rawSessionToken,
      sessionCookieOptions(expires),
    );

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("signin error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default loginRouter;
