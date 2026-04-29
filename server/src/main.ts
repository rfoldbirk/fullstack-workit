import "dotenv/config";
import express, { Router } from "express";
import cookieParser from "cookie-parser";

import usersRouter from "./routes/users";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import muscleGroupsRouter from "./routes/muscle-groups";
import exercisesRouter from "./routes/exercises";
import coachProgramTemplatesRouter from "./routes/coach/program-templates";
import coachClientsRouter from "./routes/coach/clients";
import { requireAuth } from "./middleware/auth";
import coachesRouter from "./routes/coaches";

const app = express();

app.use(express.json());
app.use(cookieParser());

const api = Router();
api.use("/users", usersRouter);
api.use("/auth", authRouter);
api.use("/me", meRouter);
app.use("/profilepictures", express.static("public/profilepictures"));
api.use("/muscle-groups", muscleGroupsRouter);
api.use("/exercises", exercisesRouter);
api.use("/coach/program-templates", requireAuth, coachProgramTemplatesRouter);
api.use("/coach/clients", requireAuth, coachClientsRouter);
api.use("/coaches", coachesRouter);

app.use("/api", api);

app.listen(process.env.PORT, () => {
  console.log(`Server ready at: http://localhost:${process.env.PORT}`);
});
