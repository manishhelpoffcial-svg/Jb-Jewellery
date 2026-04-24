import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import ordersRouter from "./orders.js";
import subscribersRouter from "./subscribers.js";
import notifyRouter from "./notify.js";
import addressesRouter from "./addresses.js";
import reviewsRouter from "./reviews.js";
import adminCustomersRouter from "./admin-customers.js";
import adminSupabaseRouter from "./admin-supabase.js";
import uploadsRouter from "./uploads.js";
import siteSettingsRouter from "./site-settings.js";
import productReviewsRouter from "./product-reviews.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/subscribers", subscribersRouter);
router.use("/notify", notifyRouter);
router.use("/addresses", addressesRouter);
router.use("/reviews", reviewsRouter);
router.use("/admin/customers", adminCustomersRouter);
router.use("/sb-admin", adminSupabaseRouter);
router.use("/uploads", uploadsRouter);
router.use("/site-settings", siteSettingsRouter);
router.use("/product-reviews", productReviewsRouter);

export default router;
