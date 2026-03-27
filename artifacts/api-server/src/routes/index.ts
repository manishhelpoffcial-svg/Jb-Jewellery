import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import ordersRouter from "./orders.js";
import subscribersRouter from "./subscribers.js";
import notifyRouter from "./notify.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/subscribers", subscribersRouter);
router.use("/notify", notifyRouter);

export default router;
