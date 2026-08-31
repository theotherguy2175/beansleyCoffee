import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { findUserByEmail, findUserById, hashPassword, toPublicUser } from "../services/auth.service.js";

export const usersRouter = Router();

usersRouter.use(requireRole("admin"));

usersRouter.get("/", (_req, res) => {
  res.json(db.select().from(users).all().map(toPublicUser));
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["admin", "staff", "customer"]),
  // Defaults to true for admin/staff (every admin/staff starts as an active
  // barista) and is always forced false for customers, regardless of input.
  isBarista: z.boolean().optional(),
});

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body);
    const email = input.email.toLowerCase();
    if (findUserByEmail(email)) throw new HttpError(409, "An account with that email already exists");

    const isBarista = input.role === "customer" ? false : (input.isBarista ?? true);
    const passwordHash = await hashPassword(input.password);
    const now = new Date().toISOString();
    const user = db
      .insert(users)
      .values({ email, passwordHash, name: input.name, role: input.role, isBarista, createdAt: now, updatedAt: now })
      .returning()
      .get();
    res.status(201).json(toPublicUser(user));
  })
);

usersRouter.get("/:id", (req, res) => {
  const user = findUserById(Number(req.params.id));
  if (!user) throw new HttpError(404, "User not found");
  res.json(toPublicUser(user));
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(["admin", "staff", "customer"]).optional(),
  isBarista: z.boolean().optional(),
});

usersRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existingUser = findUserById(id);
    if (!existingUser) throw new HttpError(404, "User not found");
    const input = updateUserSchema.parse(req.body);

    if (input.email) {
      const existing = findUserByEmail(input.email);
      if (existing && existing.id !== id) throw new HttpError(409, "An account with that email already exists");
    }

    // Customers can never be baristas, regardless of what's sent. Promoting
    // someone from customer to admin/staff defaults them to active (same as
    // creating a new admin/staff account), unless isBarista was explicitly
    // sent. Any other update (no role change, or already admin/staff) leaves
    // isBarista untouched when not explicitly sent — an unrelated edit like
    // changing someone's name shouldn't silently flip their toggle back on.
    const effectiveRole = input.role ?? existingUser.role;
    let isBarista: boolean | undefined;
    if (effectiveRole === "customer") {
      isBarista = false;
    } else if (input.isBarista !== undefined) {
      isBarista = input.isBarista;
    } else if (existingUser.role === "customer") {
      isBarista = true;
    }

    const user = db
      .update(users)
      .set({ ...input, isBarista, email: input.email?.toLowerCase(), updatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning()
      .get();
    res.json(toPublicUser(user));
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!findUserById(id)) throw new HttpError(404, "User not found");
    if (req.session.user!.id === id) throw new HttpError(400, "You can't delete your own account");
    db.delete(users).where(eq(users.id, id)).run();
    res.status(204).end();
  })
);

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

usersRouter.post(
  "/:id/reset-password",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!findUserById(id)) throw new HttpError(404, "User not found");
    const { newPassword } = resetPasswordSchema.parse(req.body);

    const passwordHash = await hashPassword(newPassword);
    db.update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, id)).run();

    await new Promise<void>((resolve, reject) => {
      req.sessionStore.all?.((err: unknown, allSessions: unknown) => {
        if (err) return reject(err);
        const sessions = (allSessions ?? []) as Array<{ sid: string; sess?: { user?: { id: number } } }>;
        const targets = sessions.filter((s) => s.sess?.user?.id === id);
        let remaining = targets.length;
        if (remaining === 0) return resolve();
        for (const s of targets) {
          req.sessionStore.destroy(s.sid, () => {
            remaining -= 1;
            if (remaining === 0) resolve();
          });
        }
      });
    });

    res.status(204).end();
  })
);
