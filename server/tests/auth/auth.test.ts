import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/main";
import { getSignupOtpForTest } from "../../src/routes/auth/otp";

describe("Auth API", () => {
  it("can sign up, verify with OTP, and delete user", async () => {
    const agent = request.agent(app);

    const fullName = "Test User";
    const email = "test@test.test";
    const password = "Test1234";

    // SIGNUP
    const signupRes = await agent.post("/api/auth/signup").send({
      fullName,
      email,
      password,
    });

    expect(signupRes.status).toBe(202);
    expect(signupRes.body.status).toBe("otp_sent");

    // GET OTP FROM CACHE
    const otp = getSignupOtpForTest(email);
    expect(otp).toBeTruthy();

    // VERIFY
    const verifyRes = await agent.post("/api/auth/signup/verify").send({
      fullName,
      email,
      password,
      otp,
    });

    expect(verifyRes.status).toBe(201);
    expect(verifyRes.body.user.email).toBe(email);
    expect(verifyRes.headers["set-cookie"]).toBeDefined();

    // DELETE USER (uses same session cookie via agent)
    const deleteRes = await agent.delete("/api/me");

    expect([200, 204]).toContain(deleteRes.status);

    // VERIFY USER IS LOGGED OUT / GONE
    const meRes = await agent.get("/api/me");
    expect(meRes.status).toBe(401);
  });
});
