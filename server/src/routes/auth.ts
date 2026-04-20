import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../prisma";
import { issueOtp, consumeOtp, normalizeEmail, sendSignupOtpMail } from "./otp";

const authRouter = Router();

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

authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body as {
      fullName?: string;
      email?: string;
      password?: string;
    };

    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: "fullName, email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.users.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const otp = issueOtp({
      fullName,
      email: normalizedEmail,
      password,
    });

    const mailResult = await sendSignupOtpMail({
      fullName,
      email: normalizedEmail,
      otp,
    });

    if (!mailResult.success) {
      return res.status(500).json({
        error: "Failed to send OTP email",
      });
    }

    return res.status(202).json({
      status: "otp_sent",
    });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

authRouter.post("/signup/verify", async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, otp } = req.body as {
      fullName?: string;
      email?: string;
      password?: string;
      otp?: string;
    };

    if (!fullName || !email || !password || !otp) {
      return res.status(400).json({
        error: "fullName, email, password and otp are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const validOtp = consumeOtp({
      fullName,
      email: normalizedEmail,
      password,
      otp,
    });

    if (!validOtp) {
      return res.status(400).json({
        error: "The verification code is invalid or has expired",
      });
    }

    const existingUser = await prisma.users.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const rawSessionToken = generateSessionToken();
    const hashedSessionToken = await bcrypt.hash(rawSessionToken, 10);
    const expires = sessionExpiryFromNow();

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          name: fullName.trim(),
          email: normalizedEmail,
        },
      });

      await tx.password.create({
        data: {
          hash: passwordHash,
          user_id: createdUser.id,
          last_updated: new Date(),
        },
      });

      await tx.token.create({
        data: {
          hash: hashedSessionToken,
          user_id: createdUser.id,
          expires,
        },
      });

      return createdUser;
    });

    res.cookie(
      SESSION_COOKIE_NAME,
      rawSessionToken,
      sessionCookieOptions(expires),
    );

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("signup verify error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

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

authRouter.post("/logout", async (req: Request, res: Response) => {
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

export default authRouter;
