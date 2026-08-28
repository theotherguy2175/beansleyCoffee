import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  cancelOwnPendingOrder,
  createOrder,
  getOrderById,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from "../services/order.service.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

const createOrderSchema = z.object({
  coffeeId: z.coerce.number(),
  baristaId: z.coerce.number().int().positive(),
  notes: z.string().max(500).optional(),
  pickupTime: z.string().min(1),
  syrupNames: z.array(z.string().min(1)).optional(),
  sizeOz: z.coerce.number().int().positive().optional(),
  strengthLabel: z.string().min(1).optional(),
});

ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const order = await createOrder(req.session.user!.id, input);
    res.status(201).json(order);
  })
);

ordersRouter.get("/mine", (req, res) => {
  res.json(listOrdersForUser(req.session.user!.id));
});

ordersRouter.get("/", requireRole("staff", "admin"), (_req, res) => {
  res.json(listAllOrders());
});

ordersRouter.get("/:id", (req, res) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) throw new HttpError(404, "Order not found");
  const sessionUser = req.session.user!;
  const isOwner = order.userId === sessionUser.id;
  const isStaffOrAdmin = sessionUser.role === "staff" || sessionUser.role === "admin";
  if (!isOwner && !isStaffOrAdmin) throw new HttpError(403, "Forbidden");
  res.json(order);
});

ordersRouter.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = cancelOwnPendingOrder(Number(req.params.id), req.session.user!.id);
    if (!order) throw new HttpError(400, "Order can't be cancelled");
    res.json(order);
  })
);

const statusSchema = z.object({
  status: z.enum(["pending", "in_progress", "ready", "completed", "cancelled"]),
});

ordersRouter.patch(
  "/:id/status",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!getOrderById(id)) throw new HttpError(404, "Order not found");
    const { status } = statusSchema.parse(req.body);
    res.json(await updateOrderStatus(id, status));
  })
);
