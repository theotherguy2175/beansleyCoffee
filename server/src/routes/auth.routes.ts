import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { findUserByEmail, findUserById, hashPassword, toPublicUser, verifyPassword } from "../services/auth.service.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();

    if (findUserByEmail(email)) {
      throw new HttpError(409, "An account with that email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const now = new Date().toISOString();
    const user = db
      .insert(users)
      .values({ email, passwordHash, name: input.name, role: "customer", createdAt: now, updatedAt: now })
      .returning()
      .get();

    req.session.user = { id: user.id, role: user.role };
    res.status(201).json(toPublicUser(user));
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    req.session.user = { id: user.id, role: user.role };
    res.json(toPublicUser(user));
  })
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).end();
  });
});

authRouter.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = findUserById(req.session.user.id);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(toPublicUser(user));
});
