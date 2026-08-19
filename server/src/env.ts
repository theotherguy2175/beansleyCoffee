import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4001),
  DB_PATH: z.string().default("./local.sqlite"),
  SESSIONS_DB_PATH: z.string().default("./local-sessions.sqlite"),
  UPLOADS_DIR: z.string().default("./uploads"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  // Session cookies are only sent by browsers back to the server if `Secure`
  // matches the connection. Behind a TLS-terminating ingress this should be
  // true (the default in production); for local/plain-HTTP testing (e.g.
  // docker-compose without a reverse proxy) it must be set to false or no
  // session will ever persist.
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  // Optional at boot — can also (or instead) be set later from the admin
  // Settings page, which is stored in the DB and takes precedence.
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAKER_NOTIFICATION_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8),
  BOOTSTRAP_ADMIN_NAME: z.string().default("Admin"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const cookieSecure = env.COOKIE_SECURE ?? env.NODE_ENV === "production";
