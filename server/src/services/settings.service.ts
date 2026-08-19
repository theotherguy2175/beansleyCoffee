import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { systemSettings } from "../db/schema.js";

export const SETTINGS_KEYS = {
  MAKER_NOTIFICATION_EMAIL: "maker_notification_email",
  SMTP_USER: "smtp_user",
  SMTP_PASS: "smtp_pass",
} as const;

export function getSetting(key: string): string | undefined {
  const row = db.select().from(systemSettings).where(eq(systemSettings.key, key)).get();
  return row?.value;
}

export function getAllSettings(): Record<string, string> {
  const rows = db.select().from(systemSettings).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string) {
  db.insert(systemSettings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
}
