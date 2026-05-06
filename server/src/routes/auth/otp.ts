import crypto from "crypto";
import { Resend } from "resend";

type PendingSignup = {
  fullName: string;
  email: string;
  password: string;
  code: string;
  creationDate: Date;
};

const cachedOtp = new Map<string, PendingSignup>();
const FIFTEEN_MINUTES = 15 * 60 * 1000;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function cleanupExpiredOtps(): void {
  const now = Date.now();

  for (const [email, otp] of Array.from(cachedOtp.entries())) {
    if (now - otp.creationDate.getTime() > FIFTEEN_MINUTES) {
      cachedOtp.delete(email);
    }
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function issueOtp(args: {
  fullName: string;
  email: string;
  password: string;
}): string {
  cleanupExpiredOtps();

  const normalizedEmail = normalizeEmail(args.email);
  const code = generateOtp();

  cachedOtp.set(normalizedEmail, {
    fullName: args.fullName.trim(),
    email: normalizedEmail,
    password: args.password,
    code,
    creationDate: new Date(),
  });

  return code;
}

export function consumeOtp(args: {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}): boolean {
  cleanupExpiredOtps();

  const normalizedEmail = normalizeEmail(args.email);
  const savedOtp = cachedOtp.get(normalizedEmail);

  if (!savedOtp) {
    return false;
  }

  const isExpired =
    Date.now() - savedOtp.creationDate.getTime() > FIFTEEN_MINUTES;

  if (isExpired) {
    cachedOtp.delete(normalizedEmail);
    return false;
  }

  const fullNameMatches = savedOtp.fullName === args.fullName.trim();
  const passwordMatches = savedOtp.password === args.password;
  const otpMatches = safeEqual(savedOtp.code, args.otp.trim());

  if (!fullNameMatches || !passwordMatches || !otpMatches) {
    return false;
  }

  cachedOtp.delete(normalizedEmail);
  return true;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function sendSignupOtpMail(args: {
  fullName: string;
  email: string;
  otp: string;
}): Promise<{ success: boolean }> {
  const firstName =
    args.fullName.trim().split(/\s+/)[0] ?? args.fullName.trim();

  if (process.env.NODE_ENV === "test" || !resend) {
    // console.log(
    //   `[signup otp] to=${args.email} firstName=${firstName} code=${args.otp}`,
    // );
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Rasmus <team@goworkit.tech>",
      to: [args.email],
      subject: "Your Workit verification code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Hello ${firstName}</h2>
          <p>Your verification code is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">
            ${args.otp}
          </p>
          <p>This code expires in 15 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("resend error:", error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("send otp mail error:", error);
    return { success: false };
  }
}

//for api test
export function getSignupOtpForTest(email: string): string | null {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("getSignupOtpForTest can only be used in test mode");
  }

  const normalizedEmail = normalizeEmail(email);
  return cachedOtp.get(normalizedEmail)?.code ?? null;
}
