import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import {
  createCoffeeType,
  createSize,
  createSyrup,
  deleteCoffeeType,
  deleteSize,
  deleteSyrup,
  listCoffeeTypes,
  listSizes,
  listSyrups,
} from "../services/options.service.js";

export const coffeeTypesRouter = Router();

coffeeTypesRouter.get("/", (_req, res) => {
  res.json(listCoffeeTypes());
});

coffeeTypesRouter.post(
  "/",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    res.status(201).json(createCoffeeType(name));
  })
);

coffeeTypesRouter.delete("/:id", requireRole("staff", "admin"), (req, res) => {
  deleteCoffeeType(Number(req.params.id));
  res.status(204).end();
});

export const syrupsRouter = Router();

syrupsRouter.get("/", (_req, res) => {
  res.json(listSyrups());
});

syrupsRouter.post(
  "/",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    res.status(201).json(createSyrup(name));
  })
);

syrupsRouter.delete("/:id", requireRole("staff", "admin"), (req, res) => {
  deleteSyrup(Number(req.params.id));
  res.status(204).end();
});

export const sizesRouter = Router();

sizesRouter.get("/", (_req, res) => {
  res.json(listSizes());
});

sizesRouter.post(
  "/",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const { ounces } = z.object({ ounces: z.coerce.number().int().positive() }).parse(req.body);
    res.status(201).json(createSize(ounces));
  })
);

sizesRouter.delete("/:id", requireRole("staff", "admin"), (req, res) => {
  deleteSize(Number(req.params.id));
  res.status(204).end();
});
