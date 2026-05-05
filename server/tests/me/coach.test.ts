import { describe, expect, it } from "vitest";
import { freshUser, finishUser } from "../helpers/user";

describe("me coach API", () => {
  it("assign coach, become coach, views and deletes coach", async () => {
    const { agent } = await freshUser();

    try {
      const coachId = 2;

      //ASSIGNS FRESHUSER TO COACH 2
      const assignCoach = await agent.post(`/api/me/coach/${coachId}`);

      expect(assignCoach.status).toBe(201);
      expect(assignCoach.body.user_id).toBe(coachId);

      const price = 1000;
      const clients = 32;

      //MAKES FRESHUSER A COACH
      const makeCoach = await agent.post(`/api/me/coach`).send({
        priceDkk: price,
        maxClients: clients,
      });

      expect(makeCoach.status).toBe(201);
      expect(makeCoach.body.price_dkk).toBe(price);

      const getCoach = await agent.get(`/api/me/coach`);
      expect(getCoach.status).toBe(200);
      expect(getCoach.body.myCoachProfile.max_clients).toBe(clients);
      expect(getCoach.body.connectedCoach.user_id).toBe(coachId);

      const delCoach = await agent.delete(`/api/me/coach`);
      expect(delCoach.status).toBe(204);

      const finalCheck = await agent.get(`/api/me/coach`);
      expect(finalCheck.status).toBe(200);
      expect(finalCheck.body.myCoachProfile).toBe(null);
      expect(finalCheck.body.connectedCoach).toBe(null);
    } finally {
      await finishUser(agent);
    }
  });
});
