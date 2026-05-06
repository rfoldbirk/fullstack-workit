import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/main";

describe("Users API", () => {
  it("GET /api/users returns users array", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/users returns only name field", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[0]).not.toHaveProperty("email");
      expect(res.body[0]).not.toHaveProperty("password");
    }
  });
});
