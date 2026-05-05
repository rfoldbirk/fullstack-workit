import { describe, expect, it } from "vitest";
import { freshUser, finishUser } from "../helpers/user";

describe("Weight logs API", () => {
  it("logs, updates, views and deletes weight", async () => {
    const { agent } = await freshUser();

    try {
      const weight = 99.5;

      const logWeight = await agent.post("/api/me/weight-logs").send({
        weight,
      });

      expect(logWeight.status).toBe(201);

      const changedWeight = 100;
      const timestamp = encodeURIComponent(logWeight.body.timestamp);

      const updateWeight = await agent
        .patch(`/api/me/weight-logs/${timestamp}`)
        .send({
          weight: changedWeight,
        });

      expect(updateWeight.status).toBe(200);

      const getWeights = await agent.get("/api/me/weight-logs");
      expect(getWeights.status).toBe(200);

      const deleteWeight = await agent.delete(
        `/api/me/weight-logs/${timestamp}`,
      );

      expect(deleteWeight.status).toBe(204);
    } finally {
      await finishUser(agent);
    }
  });
});
