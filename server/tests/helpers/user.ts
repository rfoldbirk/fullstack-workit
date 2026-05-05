import request from "supertest";
import { app } from "../../src/main";
import { getSignupOtpForTest } from "../../src/routes/auth/otp";

export type TestAgent = ReturnType<typeof request.agent>;

export async function freshUser(customEmail?: string) {
  const agent = request.agent(app);

  const fullName = "Test User";
  const password = "Test1234";

  const email =
    customEmail ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.test`;

  const signupRes = await agent.post("/api/auth/signup").send({
    fullName,
    email,
    password,
  });

  if (signupRes.status !== 202) {
    throw new Error(`Signup failed: ${JSON.stringify(signupRes.body)}`);
  }

  const otp = getSignupOtpForTest(email);

  if (!otp) {
    throw new Error("OTP not found in cache");
  }

  const verifyRes = await agent.post("/api/auth/signup/verify").send({
    fullName,
    email,
    password,
    otp,
  });

  if (verifyRes.status !== 201) {
    throw new Error(`Verify failed: ${JSON.stringify(verifyRes.body)}`);
  }

  return {
    agent,
    email,
    password,
  };
}

export async function finishUser(agent: TestAgent) {
  try {
    await agent.delete("/api/me");
  } catch {
    // Ignore cleanup errors
  }
}
