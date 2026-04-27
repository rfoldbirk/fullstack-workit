import { Router } from "express";

import signupRouter from "./signup";
import loginRouter from "./login";
import logoutRouter from "./logout";

const authRouter = Router();

authRouter.use("/signup", signupRouter);
authRouter.use("/login", loginRouter);
authRouter.use("/logout", logoutRouter);

export default authRouter;
