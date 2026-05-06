import { describe, expect, it } from "vitest";
import { freshUser, finishUser } from "../helpers/user";

async function setupAssignedTemplate() {
  const { agent: coachAgent } = await freshUser();
  const { agent: clientAgent } = await freshUser();

  const price = 1000;
  const maxClients = 32;

  // MAKES COACH USER A COACH
  const makeCoach = await coachAgent.post("/api/me/coach").send({
    priceDkk: price,
    maxClients,
  });

  expect(makeCoach.status).toBe(201);

  const coachId = makeCoach.body.user_id;

  // GET CLIENT ID
  const clientMe = await clientAgent.get("/api/me");

  expect(clientMe.status).toBe(200);

  const clientId = clientMe.body.id;

  // CONNECT CLIENT TO COACH
  const assignCoach = await clientAgent.post(`/api/me/coach/${coachId}`);

  expect(assignCoach.status).toBe(201);
  expect(assignCoach.body.user_id).toBe(coachId);

  // CREATE PROGRAM TEMPLATE
  const createTemplate = await coachAgent
    .post("/api/coach/program-templates")
    .send({
      name: "WORKOUT LOG TEST TEMPLATE",
      description: "Template used for workout log tests",
    });

  expect(createTemplate.status).toBe(201);

  const templateId = createTemplate.body.id;

  const exerciseId = 1;
  const orderNr = 1;
  const restTimer = 90;
  const reps = 10;
  const weightKg = 100;

  // ADD EXERCISE TO TEMPLATE
  const addExercise = await coachAgent
    .post(`/api/coach/program-templates/${templateId}/exercises`)
    .send({
      exercise_id: exerciseId,
      order_nr: orderNr,
      rest_timer: restTimer,
      reps,
      weight_kg: weightKg,
    });

  expect(addExercise.status).toBe(201);
  expect(addExercise.body.exercise_id).toBe(exerciseId);

  // ASSIGN TEMPLATE TO CLIENT
  const assignTemplate = await coachAgent.post(
    `/api/coach/program-templates/${templateId}/assign/${clientId}`,
  );

  expect(assignTemplate.status).toBe(201);
  expect(assignTemplate.body.user.id).toBe(clientId);
  expect(assignTemplate.body.template.id).toBe(templateId);

  return {
    coachAgent,
    clientAgent,
    coachId,
    clientId,
    templateId,
    exerciseId,
  };
}

describe("Client program templates API", () => {
  it("gets assigned program templates and a single assigned template", async () => {
    const setup = await setupAssignedTemplate();

    try {
      const { clientAgent, templateId, exerciseId } = setup;

      // GET ASSIGNED PROGRAM TEMPLATES
      const listTemplates = await clientAgent.get("/api/me/program-templates");

      expect(listTemplates.status).toBe(200);
      expect(Array.isArray(listTemplates.body)).toBe(true);
      expect(
        listTemplates.body.some(
          (template: { id: number }) => template.id === templateId,
        ),
      ).toBe(true);

      // GET SINGLE ASSIGNED PROGRAM TEMPLATE
      const singleTemplate = await clientAgent.get(
        `/api/me/program-templates/${templateId}`,
      );

      expect(singleTemplate.status).toBe(200);
      expect(singleTemplate.body.id).toBe(templateId);
      expect(Array.isArray(singleTemplate.body.exercises)).toBe(true);
      expect(singleTemplate.body.exercises[0].exercise_id).toBe(exerciseId);
    } finally {
      await finishUser(setup.clientAgent);
      await finishUser(setup.coachAgent);
    }
  }, 15000);

  it("returns 404 when client requests unassigned template", async () => {
    const { agent: coachAgent } = await freshUser();
    const { agent: clientAgent } = await freshUser();

    try {
      // MAKE COACH
      const makeCoach = await coachAgent.post("/api/me/coach").send({
        priceDkk: 500,
        maxClients: 10,
      });

      expect(makeCoach.status).toBe(201);

      // CREATE TEMPLATE BUT DO NOT ASSIGN IT TO CLIENT
      const createTemplate = await coachAgent
        .post("/api/coach/program-templates")
        .send({
          name: "UNASSIGNED TEMPLATE",
          description: "This should not be visible to the client",
        });

      expect(createTemplate.status).toBe(201);

      const templateId = createTemplate.body.id;

      // CLIENT SHOULD NOT ACCESS UNASSIGNED TEMPLATE
      const res = await clientAgent.get(
        `/api/me/program-templates/${templateId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Template not found");
    } finally {
      await finishUser(clientAgent);
      await finishUser(coachAgent);
    }
  }, 15000);
});

describe("Workout logs API", () => {
  it("starts, views, finishes and deletes a workout log", async () => {
    const setup = await setupAssignedTemplate();

    try {
      const { clientAgent, templateId } = setup;

      // START WORKOUT LOG
      const startWorkout = await clientAgent
        .post("/api/me/workout-logs/start")
        .send({
          template_id: templateId,
          date: "2026-04-24T08:00:00.000Z",
          note: "Started workout",
        });

      expect(startWorkout.status).toBe(201);
      expect(startWorkout.body.template_id).toBe(templateId);
      expect(startWorkout.body.note).toBe("Started workout");

      const logId = startWorkout.body.id;

      // GET ALL WORKOUT LOGS
      const listLogs = await clientAgent.get("/api/me/workout-logs");

      expect(listLogs.status).toBe(200);
      expect(Array.isArray(listLogs.body)).toBe(true);
      expect(
        listLogs.body.some((log: { id: number }) => log.id === logId),
      ).toBe(true);

      // GET SINGLE WORKOUT LOG
      const singleLog = await clientAgent.get(`/api/me/workout-logs/${logId}`);

      expect(singleLog.status).toBe(200);
      expect(singleLog.body.id).toBe(logId);
      expect(singleLog.body.template_id).toBe(templateId);

      // FINISH WORKOUT LOG
      const finishLog = await clientAgent
        .patch(`/api/me/workout-logs/${logId}/finish`)
        .send({
          note: "Finished workout",
        });

      expect(finishLog.status).toBe(200);
      expect(finishLog.body.id).toBe(logId);
      expect(finishLog.body.note).toBe("Finished workout");

      // DELETE WORKOUT LOG
      const deleteLog = await clientAgent.delete(
        `/api/me/workout-logs/${logId}`,
      );

      expect(deleteLog.status).toBe(204);

      // VERIFY DELETED
      const afterDelete = await clientAgent.get(
        `/api/me/workout-logs/${logId}`,
      );

      expect(afterDelete.status).toBe(404);
      expect(afterDelete.body.error).toBe("Workout log not found");
    } finally {
      await finishUser(setup.clientAgent);
      await finishUser(setup.coachAgent);
    }
  }, 15000);

  it("creates, updates and deletes exercise logs inside a workout log", async () => {
    const setup = await setupAssignedTemplate();

    try {
      const { clientAgent, templateId, exerciseId } = setup;

      // START WORKOUT LOG
      const startWorkout = await clientAgent
        .post("/api/me/workout-logs/start")
        .send({
          template_id: templateId,
          date: "2026-04-25T08:00:00.000Z",
        });

      expect(startWorkout.status).toBe(201);

      const logId = startWorkout.body.id;

      // CREATE EXERCISE LOG
      const createExerciseLog = await clientAgent
        .post(`/api/me/workout-logs/${logId}/exercise-logs`)
        .send({
          exercise_id: exerciseId,
          set_nr: 1,
          reps: 10,
          kg: 80,
        });

      expect(createExerciseLog.status).toBe(201);
      expect(createExerciseLog.body.exercise_id).toBe(exerciseId);
      expect(createExerciseLog.body.set_nr).toBe(1);
      expect(createExerciseLog.body.reps).toBe(10);
      expect(Number(createExerciseLog.body.kg)).toBe(80);

      const exerciseLogId = createExerciseLog.body.id;

      // UPDATE EXERCISE LOG
      const updateExerciseLog = await clientAgent
        .patch(`/api/me/workout-logs/${logId}/exercise-logs/${exerciseLogId}`)
        .send({
          set_nr: 2,
          reps: 8,
          kg: 85,
        });

      expect(updateExerciseLog.status).toBe(200);
      expect(updateExerciseLog.body.id).toBe(exerciseLogId);
      expect(updateExerciseLog.body.set_nr).toBe(2);
      expect(updateExerciseLog.body.reps).toBe(8);
      expect(Number(updateExerciseLog.body.kg)).toBe(85);

      // DELETE EXERCISE LOG
      const deleteExerciseLog = await clientAgent.delete(
        `/api/me/workout-logs/${logId}/exercise-logs/${exerciseLogId}`,
      );

      expect(deleteExerciseLog.status).toBe(204);

      // VERIFY EXERCISE LOG IS REMOVED
      const singleLog = await clientAgent.get(`/api/me/workout-logs/${logId}`);

      expect(singleLog.status).toBe(200);
      expect(
        singleLog.body.exercise_log.some(
          (log: { id: number }) => log.id === exerciseLogId,
        ),
      ).toBe(false);
    } finally {
      await finishUser(setup.clientAgent);
      await finishUser(setup.coachAgent);
    }
  }, 15000);

  it("rejects starting a workout from an unassigned template", async () => {
    const { agent: coachAgent } = await freshUser();
    const { agent: clientAgent } = await freshUser();

    try {
      // MAKE COACH
      const makeCoach = await coachAgent.post("/api/me/coach").send({
        priceDkk: 500,
        maxClients: 10,
      });

      expect(makeCoach.status).toBe(201);

      // CREATE TEMPLATE BUT DO NOT ASSIGN IT
      const createTemplate = await coachAgent
        .post("/api/coach/program-templates")
        .send({
          name: "UNASSIGNED WORKOUT TEMPLATE",
          description: "Client should not start this",
        });

      expect(createTemplate.status).toBe(201);

      const templateId = createTemplate.body.id;

      // CLIENT TRIES TO START UNASSIGNED TEMPLATE
      const startWorkout = await clientAgent
        .post("/api/me/workout-logs/start")
        .send({
          template_id: templateId,
        });

      expect(startWorkout.status).toBe(403);
      expect(startWorkout.body.error).toBe(
        "You do not have access to this template",
      );
    } finally {
      await finishUser(clientAgent);
      await finishUser(coachAgent);
    }
  }, 15000);

  it("rejects exercise log when exercise is not part of the template", async () => {
    const setup = await setupAssignedTemplate();

    try {
      const { clientAgent, templateId } = setup;

      // START WORKOUT LOG
      const startWorkout = await clientAgent
        .post("/api/me/workout-logs/start")
        .send({
          template_id: templateId,
        });

      expect(startWorkout.status).toBe(201);

      const logId = startWorkout.body.id;

      const outsideExerciseId = 2;

      // TRY TO LOG AN EXERCISE THAT IS NOT PART OF THIS TEMPLATE
      const res = await clientAgent
        .post(`/api/me/workout-logs/${logId}/exercise-logs`)
        .send({
          exercise_id: outsideExerciseId,
          set_nr: 1,
          reps: 10,
          kg: 80,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Exercise is not part of this workout template",
      );
    } finally {
      await finishUser(setup.clientAgent);
      await finishUser(setup.coachAgent);
    }
  }, 15000);
});
