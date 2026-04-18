import "dotenv/config";
import express, { Router } from "express";
import cookieParser from "cookie-parser";

import usersRouter from "./routes/users";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";

const app = express();

app.use(express.json());
app.use(cookieParser());

const api = Router();
api.use("/users", usersRouter);
api.use("/auth", authRouter);
api.use("/me", meRouter);

app.use("/api", api);

app.listen(process.env.PORT, () => {
  console.log(`Server ready at: http://localhost:${process.env.PORT}`);
});
