import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/main";
import { freshUser, finishUser } from "../helpers/user";

describe("Muscle groups API", () => {
  it("GET /api/muscle-groups returns 401 without login", async () => {
    const res = await request(app).get("/api/muscle-groups");

    expect(res.status).toBe(401);
  });

  it("GET /api/muscle-groups returns muscle groups when logged in", async () => {
    const { agent } = await freshUser();

    try {
      const res = await agent.get("/api/muscle-groups");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    } finally {
      await finishUser(agent);
    }
  });

  it("GET /api/muscle-groups returns objects with id and name if data exists", async () => {
    const { agent } = await freshUser();

    try {
      const res = await agent.get("/api/muscle-groups");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("id");
        expect(res.body[0]).toHaveProperty("name");
      }
    } finally {
      await finishUser(agent);
    }
  });
});
