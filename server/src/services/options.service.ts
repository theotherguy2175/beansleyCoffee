import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { coffeeTypes, syrups, sizes } from "../db/schema.js";
import { HttpError } from "../middleware/errorHandler.js";

function isUniqueConstraintError(err: unknown) {
  return err instanceof Error && "code" in err && String((err as { code?: unknown }).code).startsWith("SQLITE_CONSTRAINT");
}

// --- Coffee types ---

export function listCoffeeTypes() {
  return db.select().from(coffeeTypes).orderBy(asc(coffeeTypes.name)).all();
}

export function createCoffeeType(name: string) {
  try {
    return db.insert(coffeeTypes).values({ name, createdAt: new Date().toISOString() }).returning().get();
  } catch (err) {
    if (isUniqueConstraintError(err)) throw new HttpError(409, "That coffee type already exists");
    throw err;
  }
}

export function deleteCoffeeType(id: number) {
  db.delete(coffeeTypes).where(eq(coffeeTypes.id, id)).run();
}

// --- Syrups ---

export function listSyrups() {
  return db.select().from(syrups).orderBy(asc(syrups.name)).all();
}

export function createSyrup(name: string) {
  try {
    return db.insert(syrups).values({ name, createdAt: new Date().toISOString() }).returning().get();
  } catch (err) {
    if (isUniqueConstraintError(err)) throw new HttpError(409, "That syrup already exists");
    throw err;
  }
}

export function deleteSyrup(id: number) {
  db.delete(syrups).where(eq(syrups.id, id)).run();
}

// --- Sizes ---

export function listSizes() {
  return db.select().from(sizes).orderBy(asc(sizes.ounces)).all();
}

export function createSize(ounces: number) {
  try {
    return db.insert(sizes).values({ ounces, createdAt: new Date().toISOString() }).returning().get();
  } catch (err) {
    if (isUniqueConstraintError(err)) throw new HttpError(409, "That size already exists");
    throw err;
  }
}

export function deleteSize(id: number) {
  db.delete(sizes).where(eq(sizes.id, id)).run();
}
