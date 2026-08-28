import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { coffeesRouter } from "./coffees.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { usersRouter } from "./users.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { coffeeTypesRouter, sizesRouter, syrupsRouter } from "./options.routes.js";
import { themeRouter } from "./theme.routes.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { env } from "../env.js";
import { listActiveBaristas } from "../services/auth.service.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));

apiRouter.use("/auth", authRouter);
apiRouter.use("/coffees", coffeesRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/coffee-types", coffeeTypesRouter);
apiRouter.use("/syrups", syrupsRouter);
apiRouter.use("/sizes", sizesRouter);
apiRouter.use("/theme", themeRouter);
apiRouter.use("/admin/users", usersRouter);
apiRouter.use("/admin/settings", settingsRouter);
apiRouter.get("/admin/version", requireRole("admin"), (_req, res) => res.json({ version: env.APP_VERSION }));
// Deliberately not under /admin — any logged-in customer needs this to pick
// a barista on the order form, so it only exposes id/name, not full user
// records the way /admin/users does.
apiRouter.get("/baristas", requireAuth, (_req, res) => res.json(listActiveBaristas()));
