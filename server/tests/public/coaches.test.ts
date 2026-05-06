import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/main";
import { freshUser, finishUser } from "../helpers/user";

describe("Coaches API", () => {
  it("GET /api/coaches returns 401 without login", async () => {
    const res = await request(app).get("/api/coaches");

    expect(res.status).toBe(401);
  });

  it("GET /api/coaches returns coaches when logged in", async () => {
    const { agent } = await freshUser();

    try {
      const res = await agent.get("/api/coaches");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("summary");
      expect(res.body).toHaveProperty("coaches");
      expect(Array.isArray(res.body.coaches)).toBe(true);
      expect(typeof res.body.summary.totalCoaches).toBe("number");
    } finally {
      await finishUser(agent);
    }
  });

  it("GET /api/coaches includes a newly created coach", async () => {
    const { agent } = await freshUser();

    try {
      const makeCoach = await agent.post("/api/me/coach").send({
        priceDkk: 500,
        maxClients: 10,
      });

      expect(makeCoach.status).toBe(201);

      const meRes = await agent.get("/api/me");
      expect(meRes.status).toBe(200);

      const userId = meRes.body.id;

      const res = await agent.get("/api/coaches");

      expect(res.status).toBe(200);
      expect(
        res.body.coaches.some((coach: { id: number }) => coach.id === userId),
      ).toBe(true);
    } finally {
      await finishUser(agent);
    }
  });
});
