import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { env } from "../env.js";
import { hashPassword } from "../services/auth.service.js";

export async function bootstrapAdmin() {
  const existingAdmin = db.select().from(users).where(eq(users.role, "admin")).get();
  if (existingAdmin) return;

  const existingByEmail = db.select().from(users).where(eq(users.email, env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase())).get();
  if (existingByEmail) {
    db.update(users).set({ role: "admin", isBarista: true }).where(eq(users.id, existingByEmail.id)).run();
    console.log(`Promoted existing user ${existingByEmail.email} to admin`);
    return;
  }

  const passwordHash = await hashPassword(env.BOOTSTRAP_ADMIN_PASSWORD);
  const now = new Date().toISOString();
  db.insert(users)
    .values({
      email: env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      name: env.BOOTSTRAP_ADMIN_NAME,
      role: "admin",
      isBarista: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  console.log(`Bootstrap admin created: ${env.BOOTSTRAP_ADMIN_EMAIL}`);
}
