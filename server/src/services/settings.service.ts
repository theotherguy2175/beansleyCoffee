import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { systemSettings } from "../db/schema.js";

export const SETTINGS_KEYS = {
  MAKER_NOTIFICATION_EMAIL: "maker_notification_email",
  SMTP_USER: "smtp_user",
  SMTP_PASS: "smtp_pass",
  THEME_BACKGROUND: "theme_background",
  THEME_FOREGROUND: "theme_foreground",
  THEME_PRIMARY: "theme_primary",
  THEME_SECONDARY: "theme_secondary",
  THEME_ACCENT: "theme_accent",
  THEME_CARD: "theme_card",
  THEME_BORDER: "theme_border",
} as const;

export const THEME_SETTING_KEYS: string[] = [
  SETTINGS_KEYS.THEME_BACKGROUND,
  SETTINGS_KEYS.THEME_FOREGROUND,
  SETTINGS_KEYS.THEME_PRIMARY,
  SETTINGS_KEYS.THEME_SECONDARY,
  SETTINGS_KEYS.THEME_ACCENT,
  SETTINGS_KEYS.THEME_CARD,
  SETTINGS_KEYS.THEME_BORDER,
];

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

export function deleteSetting(key: string) {
  db.delete(systemSettings).where(eq(systemSettings.key, key)).run();
}
