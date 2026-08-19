import { eq, asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { coffees, coffeeTypes, coffeeStrengthOptions, type NewCoffee } from "../db/schema.js";

const coffeeColumns = {
  id: coffees.id,
  name: coffees.name,
  description: coffees.description,
  imagePath: coffees.imagePath,
  isAvailable: coffees.isAvailable,
  sortOrder: coffees.sortOrder,
  coffeeTypeId: coffees.coffeeTypeId,
  coffeeTypeName: coffeeTypes.name,
  createdBy: coffees.createdBy,
  createdAt: coffees.createdAt,
  updatedAt: coffees.updatedAt,
};

function withCoffeeType() {
  return db.select(coffeeColumns).from(coffees).leftJoin(coffeeTypes, eq(coffees.coffeeTypeId, coffeeTypes.id));
}

export function listAvailableCoffees() {
  return withCoffeeType().where(eq(coffees.isAvailable, true)).orderBy(asc(coffees.sortOrder), asc(coffees.name)).all();
}

export function listAllCoffees() {
  return withCoffeeType().orderBy(asc(coffees.sortOrder), asc(coffees.name)).all();
}

export function getCoffeeById(id: number) {
  const coffee = withCoffeeType().where(eq(coffees.id, id)).get();
  if (!coffee) return undefined;
  return { ...coffee, strengthOptions: listStrengthOptions(id) };
}

export function createCoffee(data: NewCoffee) {
  const now = new Date().toISOString();
  return db
    .insert(coffees)
    .values({ ...data, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

export function updateCoffee(id: number, data: Partial<NewCoffee>) {
  return db
    .update(coffees)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(coffees.id, id))
    .returning()
    .get();
}

export function setCoffeeAvailability(id: number, isAvailable: boolean) {
  return db
    .update(coffees)
    .set({ isAvailable, updatedAt: new Date().toISOString() })
    .where(eq(coffees.id, id))
    .returning()
    .get();
}

export function deleteCoffee(id: number) {
  db.delete(coffees).where(eq(coffees.id, id)).run();
}

export function listStrengthOptions(coffeeId: number) {
  return db
    .select()
    .from(coffeeStrengthOptions)
    .where(eq(coffeeStrengthOptions.coffeeId, coffeeId))
    .orderBy(asc(coffeeStrengthOptions.sortOrder))
    .all();
}

export function replaceStrengthOptions(coffeeId: number, labels: string[]) {
  db.delete(coffeeStrengthOptions).where(eq(coffeeStrengthOptions.coffeeId, coffeeId)).run();
  const now = new Date().toISOString();
  labels.forEach((label, index) => {
    if (!label.trim()) return;
    db.insert(coffeeStrengthOptions)
      .values({ coffeeId, label: label.trim(), sortOrder: index, createdAt: now })
      .run();
  });
  return listStrengthOptions(coffeeId);
}
