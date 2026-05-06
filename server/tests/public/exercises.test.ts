import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/main";
import { freshUser, finishUser } from "../helpers/user";

describe("Exercises API", () => {
  it("GET /api/exercises returns 401 without login", async () => {
    const res = await request(app).get("/api/exercises");

    expect(res.status).toBe(401);
  });

  it("GET /api/exercises returns exercises when logged in", async () => {
    const { agent } = await freshUser();

    try {
      const res = await agent.get("/api/exercises");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    } finally {
      await finishUser(agent);
    }
  });

  it("GET /api/exercises/:id returns one exercise", async () => {
    const { agent } = await freshUser();

    try {
      const exercisesRes = await agent.get("/api/exercises");

      expect(exercisesRes.status).toBe(200);
      expect(Array.isArray(exercisesRes.body)).toBe(true);
      expect(exercisesRes.body.length).toBeGreaterThan(0);

      const exerciseId = exercisesRes.body[0].id;

      const res = await agent.get(`/api/exercises/${exerciseId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(exerciseId);
    } finally {
      await finishUser(agent);
    }
  });

  it("GET /api/exercises/:id returns 400 for invalid id", async () => {
    const { agent } = await freshUser();

    try {
      const res = await agent.get("/api/exercises/not-a-number");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid exercise id");
    } finally {
      await finishUser(agent);
    }
  });

  it("GET /api/exercises/:id/muscle-groups returns muscle groups", async () => {
    const { agent } = await freshUser();

    try {
      const exercisesRes = await agent.get("/api/exercises");

      expect(exercisesRes.status).toBe(200);
      expect(Array.isArray(exercisesRes.body)).toBe(true);
      expect(exercisesRes.body.length).toBeGreaterThan(0);

      const exerciseId = exercisesRes.body[0].id;

      const res = await agent.get(`/api/exercises/${exerciseId}/muscle-groups`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    } finally {
      await finishUser(agent);
    }
  });
});
