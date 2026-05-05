import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/main";

describe("Login and logout API", () => {
  it("POST /api/auth/login logs in an existing user", async () => {
    const email = "client@test.test";
    const password = "Test1234";

    // LOGIN CLIENT TEST USER
    const loginRes = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe(email);
    expect(loginRes.headers["set-cookie"]).toBeDefined();
  });

  // LOGOUT CLIENT TEST USER
  it("POST /api/auth/logout logs out the current user", async () => {
    const agent = request.agent(app);

    const email = "client@test.test";
    const password = "Test1234";

    // LOGIN FIRST (to get session cookie)
    const loginRes = await agent.post("/api/auth/login").send({
      email,
      password,
    });

    expect(loginRes.status).toBe(200);

    // VERIFY USER IS LOGGED IN
    const meBeforeLogout = await agent.get("/api/me");
    expect(meBeforeLogout.status).toBe(200);

    // LOGOUT CLIENT TEST USER
    const logoutRes = await agent.post("/api/auth/logout");

    expect([200, 204]).toContain(logoutRes.status);

    // VERIFY USER IS LOGGED OUT
    const meAfterLogout = await agent.get("/api/me");
    expect(meAfterLogout.status).toBe(401);
  });
});
