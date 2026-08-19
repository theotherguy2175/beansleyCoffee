import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../env.js";
import { db } from "../db/client.js";
import { coffees } from "../db/schema.js";
import { createCoffee, replaceStrengthOptions } from "../services/coffee.service.js";
import { createCoffeeType, createSize, createSyrup, listCoffeeTypes, listSizes, listSyrups } from "../services/options.service.js";
import { coffeeImagePublicPath } from "../middleware/upload.js";

const SEED_DIR = path.join(import.meta.dirname, "../../seed");

interface SeedCoffee {
  name: string;
  description: string;
  image: string;
  type: string;
  strengthOptions: string[];
}

interface SeedData {
  coffeeTypes: string[];
  syrups: string[];
  sizes: number[];
  coffees: SeedCoffee[];
}

function ensureCoffeeType(name: string, existing: Map<string, number>): number {
  const found = existing.get(name);
  if (found) return found;
  const created = createCoffeeType(name);
  existing.set(name, created.id);
  return created.id;
}

export async function seedMenuIfEmpty() {
  const hasCoffees = db.select({ id: coffees.id }).from(coffees).limit(1).get();
  if (hasCoffees) return;

  const seedFile = path.join(SEED_DIR, "coffees.json");
  if (!fs.existsSync(seedFile)) return;

  const data = JSON.parse(fs.readFileSync(seedFile, "utf-8")) as SeedData;

  const typesByName = new Map(listCoffeeTypes().map((t) => [t.name, t.id]));
  for (const name of data.coffeeTypes) ensureCoffeeType(name, typesByName);

  const syrupNames = new Set(listSyrups().map((s) => s.name));
  for (const name of data.syrups) {
    if (!syrupNames.has(name)) createSyrup(name);
  }

  const sizeOunces = new Set(listSizes().map((s) => s.ounces));
  for (const ounces of data.sizes) {
    if (!sizeOunces.has(ounces)) createSize(ounces);
  }

  const uploadsCoffeesDir = path.join(env.UPLOADS_DIR, "coffees");
  fs.mkdirSync(uploadsCoffeesDir, { recursive: true });

  for (const seedCoffee of data.coffees) {
    const sourcePath = path.join(SEED_DIR, "images", seedCoffee.image);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Seed image missing, skipping: ${seedCoffee.image}`);
      continue;
    }

    const ext = path.extname(seedCoffee.image);
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.copyFileSync(sourcePath, path.join(uploadsCoffeesDir, filename));

    const coffee = createCoffee({
      name: seedCoffee.name,
      description: seedCoffee.description,
      imagePath: coffeeImagePublicPath(filename),
      isAvailable: true,
      sortOrder: 0,
      coffeeTypeId: ensureCoffeeType(seedCoffee.type, typesByName),
      createdBy: null,
    });

    if (seedCoffee.strengthOptions.length > 0) {
      replaceStrengthOptions(coffee.id, seedCoffee.strengthOptions);
    }
  }

  console.log(`Seeded menu: ${data.coffees.length} coffees`);
}
