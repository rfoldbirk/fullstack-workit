import { describe, expect, it } from "vitest";
import { freshUser, finishUser } from "../helpers/user";

describe("coach program templates", () => {
  it("become coach and view clients make program add exercise and assign program", async () => {
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

      const templateName = "TEST TEMPLATE";
      const templateDesc = "FOR TESTING";

      // CREATE NEW PROGRAM TEMPLATE
      const makeTemplate = await coachAgent
        .post("/api/coach/program-templates")
        .send({
          name: templateName,
          description: templateDesc,
        });
      expect(makeTemplate.status).toBe(201);
      expect(makeTemplate.body.name).toBe(templateName);
      expect(makeTemplate.body.description).toBe(templateDesc);

      const templateId = makeTemplate.body.id;

      const newTemplateName = "TEST TEMPLATE UPDATE";
      const newTemplateDesc = "FOR TESTING UPDATE";

      // CHANGE TEMPLATE DESC AND NAME
      const changeTemplate = await coachAgent
        .patch(`/api/coach/program-templates/${templateId}`)
        .send({
          name: newTemplateName,
          description: newTemplateDesc,
        });
      expect(changeTemplate.status).toBe(200);
      expect(changeTemplate.body.name).toBe(newTemplateName);
      expect(changeTemplate.body.description).toBe(newTemplateDesc);

      const templateExerciseId = 1;
      const templateExerciseOrder = 1;
      const restTimer = 90;

      // ADD EXERCISE TO TEMPLATE
      const addExercise = await coachAgent
        .post(`/api/coach/program-templates/${templateId}/exercises`)
        .send({
          exercise_id: templateExerciseId,
          order_nr: templateExerciseOrder,
          rest_timer: restTimer,
        });
      expect(addExercise.status).toBe(201);
      expect(addExercise.body.template_id).toBe(templateId);
      expect(addExercise.body.exercise_id).toBe(templateExerciseId);
      expect(addExercise.body.order_nr).toBe(templateExerciseOrder);
      expect(addExercise.body.rest_timer).toBe(restTimer);

      const exerciseID = addExercise.body.id;
      const newTemplateExerciseId = 2;
      const newTemplateExerciseOrder = 2;
      const newRestTimer = 120;

      // CHANGE EXERCISE
      const changeExercise = await coachAgent
        .patch(
          `/api/coach/program-templates/${templateId}/exercises/${exerciseID}`,
        )
        .send({
          exercise_id: newTemplateExerciseId,
          order_nr: newTemplateExerciseOrder,
          rest_timer: newRestTimer,
        });
      expect(changeExercise.status).toBe(200);
      expect(changeExercise.body.template_id).toBe(templateId);
      expect(changeExercise.body.exercise_id).toBe(newTemplateExerciseId);
      expect(changeExercise.body.order_nr).toBe(newTemplateExerciseOrder);
      expect(changeExercise.body.rest_timer).toBe(newRestTimer);

      // ASSING CLIENT TO PROGRAM
      const assignClient = await coachAgent.post(
        `/api/coach/program-templates/${templateId}/assign/${clientId}`,
      );
      expect(assignClient.status).toBe(201);
      expect(assignClient.body.user.id).toBe(clientId);
      expect(assignClient.body.template.id).toBe(templateId);

      // CHECK EVERYTHING IS ADDED TO PROGRAM: EXERCISE WITH UPDATE, NAME AND DESC WITH UPDATE AND ASSIGNMENTS
      const checkAll = await coachAgent.get(
        `/api/coach/program-templates/${templateId}`,
      );
      expect(checkAll.status).toBe(200);
      expect(checkAll.body.id).toBe(templateId);
      expect(checkAll.body.name).toBe(newTemplateName);
      expect(checkAll.body.description).toBe(newTemplateDesc);
      expect(Array.isArray(checkAll.body.exercises)).toBe(true);
      expect(Array.isArray(checkAll.body.assignments)).toBe(true);
      expect(checkAll.body.exercises[0].exercise_id).toBe(
        newTemplateExerciseId,
      );
      expect(checkAll.body.exercises[0].order_nr).toBe(
        newTemplateExerciseOrder,
      );
      expect(checkAll.body.exercises[0].rest_timer).toBe(newRestTimer);
      expect(checkAll.body.assignments[0].user_id).toBe(clientId);

      // DELETE PROGRAM ASSIGNMENT
      const deleteAssignment = await coachAgent.delete(
        `/api/coach/program-templates/${templateId}/assign/${clientId}`,
      );
      expect(deleteAssignment.status).toBe(204);

      // VERIFY ASSIGNMENT IS REMOVED
      const checkAfterAssignmentDelete = await coachAgent.get(
        `/api/coach/program-templates/${templateId}`,
      );
      expect(checkAfterAssignmentDelete.status).toBe(200);
      expect(
        checkAfterAssignmentDelete.body.assignments.some(
          (assignment: { user_id: number }) => assignment.user_id === clientId,
        ),
      ).toBe(false);

      // DELETE EXERCISE FROM TEMPLATE
      const deleteExercise = await coachAgent.delete(
        `/api/coach/program-templates/${templateId}/exercises/${exerciseID}`,
      );
      expect(deleteExercise.status).toBe(204);

      // VERIFY EXERCISE IS REMOVED
      const checkAfterExerciseDelete = await coachAgent.get(
        `/api/coach/program-templates/${templateId}`,
      );
      expect(checkAfterExerciseDelete.status).toBe(200);
      expect(
        checkAfterExerciseDelete.body.exercises.some(
          (exercise: { id: number }) => exercise.id === exerciseID,
        ),
      ).toBe(false);

      // DELETE PROGRAM TEMPLATE
      const deleteTemplate = await coachAgent.delete(
        `/api/coach/program-templates/${templateId}`,
      );

      expect(deleteTemplate.status).toBe(204);
      // VERIFY PROGRAM TEMPLATE IS DELETED
      const checkAfterTemplateDelete = await coachAgent.get(
        `/api/coach/program-templates/${templateId}`,
      );

      expect(checkAfterTemplateDelete.status).toBe(404);
    } finally {
      await finishUser(clientAgent);
      await finishUser(coachAgent);
    }
  }, 15000);
});
