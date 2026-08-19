import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { coffeesRouter } from "./coffees.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { usersRouter } from "./users.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { coffeeTypesRouter, sizesRouter, syrupsRouter } from "./options.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));

apiRouter.use("/auth", authRouter);
apiRouter.use("/coffees", coffeesRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/coffee-types", coffeeTypesRouter);
apiRouter.use("/syrups", syrupsRouter);
apiRouter.use("/sizes", sizesRouter);
apiRouter.use("/admin/users", usersRouter);
apiRouter.use("/admin/settings", settingsRouter);
