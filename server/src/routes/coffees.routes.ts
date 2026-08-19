import { Router } from "express";
import { z } from "zod";
import {
  createCoffee,
  deleteCoffee,
  getCoffeeById,
  listAllCoffees,
  listAvailableCoffees,
  replaceStrengthOptions,
  setCoffeeAvailability,
  updateCoffee,
} from "../services/coffee.service.js";
import { coffeeImagePublicPath, uploadCoffeeImage } from "../middleware/upload.js";
import { requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";

export const coffeesRouter = Router();

// --- Public ---

coffeesRouter.get("/", (_req, res) => {
  res.json(listAvailableCoffees());
});

coffeesRouter.get("/all", requireRole("staff", "admin"), (_req, res) => {
  res.json(listAllCoffees());
});

coffeesRouter.get("/:id", (req, res) => {
  const coffee = getCoffeeById(Number(req.params.id));
  if (!coffee || (!coffee.isAvailable && !req.session.user)) {
    throw new HttpError(404, "Coffee not found");
  }
  res.json(coffee);
});

// --- Staff / Admin ---

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const coffeeBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isAvailable: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().optional(),
  coffeeTypeId: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
  strengthOptions: z.preprocess(emptyToUndefined, z.string().optional()),
});

function parseStrengthOptions(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const parsed: unknown = JSON.parse(raw);
  return z.array(z.string()).parse(parsed);
}

coffeesRouter.post(
  "/",
  requireRole("staff", "admin"),
  uploadCoffeeImage,
  asyncHandler(async (req, res) => {
    const input = coffeeBodySchema.parse(req.body);
    const coffee = createCoffee({
      name: input.name,
      description: input.description,
      isAvailable: input.isAvailable ?? true,
      sortOrder: input.sortOrder ?? 0,
      coffeeTypeId: input.coffeeTypeId ?? null,
      imagePath: req.file ? coffeeImagePublicPath(req.file.filename) : null,
      createdBy: req.session.user!.id,
    });
    const strengthOptions = parseStrengthOptions(input.strengthOptions);
    if (strengthOptions) replaceStrengthOptions(coffee.id, strengthOptions);
    res.status(201).json(getCoffeeById(coffee.id));
  })
);

coffeesRouter.put(
  "/:id",
  requireRole("staff", "admin"),
  uploadCoffeeImage,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!getCoffeeById(id)) throw new HttpError(404, "Coffee not found");

    const input = coffeeBodySchema.partial().parse(req.body);
    const { strengthOptions: rawStrengthOptions, ...rest } = input;
    updateCoffee(id, {
      ...rest,
      coffeeTypeId: "coffeeTypeId" in input ? (input.coffeeTypeId ?? null) : undefined,
      ...(req.file ? { imagePath: coffeeImagePublicPath(req.file.filename) } : {}),
    });
    const strengthOptions = parseStrengthOptions(rawStrengthOptions);
    if (strengthOptions) replaceStrengthOptions(id, strengthOptions);
    res.json(getCoffeeById(id));
  })
);

coffeesRouter.patch(
  "/:id/availability",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!getCoffeeById(id)) throw new HttpError(404, "Coffee not found");
    const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body);
    res.json(setCoffeeAvailability(id, isAvailable));
  })
);

coffeesRouter.delete(
  "/:id",
  requireRole("staff", "admin"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!getCoffeeById(id)) throw new HttpError(404, "Coffee not found");
    deleteCoffee(id);
    res.status(204).end();
  })
);
