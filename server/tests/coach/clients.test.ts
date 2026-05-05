import { describe, expect, it } from "vitest";
import { freshUser, finishUser } from "../helpers/user";

describe("coach clients", () => {
  it("become coach and view clients", async () => {
    const { agent: coachAgent } = await freshUser();
    const { agent: clientAgent } = await freshUser();

    try {
      const price = 1000;
      const clients = 32;

      // MAKES FIRST FRESHUSER A COACH
      const makeCoach = await coachAgent.post(`/api/me/coach`).send({
        priceDkk: price,
        maxClients: clients,
      });

      expect(makeCoach.status).toBe(201);
      expect(makeCoach.body.price_dkk).toBe(price);

      const coachId = makeCoach.body.user_id;

      // GET CLIENT ID BEFORE ASSIGNING
      const clientMe = await clientAgent.get("/api/me");

      expect(clientMe.status).toBe(200);

      const clientId = clientMe.body.id;

      // MAKES SECOND FRESHUSER A CLIENT OF THAT COACH
      const assignCoach = await clientAgent.post(`/api/me/coach/${coachId}`);
      expect(assignCoach.status).toBe(201);
      expect(assignCoach.body.user_id).toBe(coachId);

      // VIEW COACH CLIENTS
      const viewClients = await coachAgent.get("/api/coach/clients");
      expect(viewClients.status).toBe(200);

      expect(viewClients.body.summary.clientCount).toBeGreaterThanOrEqual(1);
      expect(viewClients.body.summary.maxClients).toBe(clients);
      expect(Array.isArray(viewClients.body.clients)).toBe(true);

      // VERIFY THE FRESH CLIENT IS INCLUDED
      expect(
        viewClients.body.clients.some(
          (client: { id: number }) => client.id === clientId,
        ),
      ).toBe(true);
    } finally {
      await finishUser(clientAgent);
      await finishUser(coachAgent);
    }
  });
});
