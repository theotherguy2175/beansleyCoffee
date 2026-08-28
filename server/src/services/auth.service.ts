import bcrypt from "bcrypt";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema.js";

const BCRYPT_COST = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function findUserByEmail(email: string): User | undefined {
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
}

export function findUserById(id: number): User | undefined {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isBarista: user.isBarista,
    createdAt: user.createdAt,
  };
}

export function listActiveBaristas(): Array<{ id: number; name: string }> {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(inArray(users.role, ["admin", "staff"]), eq(users.isBarista, true)))
    .all();
}
