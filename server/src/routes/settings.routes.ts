import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.js";
import { deleteSetting, getAllSettings, setSetting, SETTINGS_KEYS, THEME_SETTING_KEYS } from "../services/settings.service.js";
import { sendTestEmail } from "../services/email.service.js";
import { env } from "../env.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const settingsRouter = Router();

settingsRouter.use(requireRole("admin"));

function buildSettingsResponse() {
  const all = getAllSettings();
  const { [SETTINGS_KEYS.SMTP_PASS]: smtpPass, ...rest } = all;
  return {
    ...rest,
    smtp_user: rest[SETTINGS_KEYS.SMTP_USER] ?? env.SMTP_USER ?? "",
    smtpPassSet: Boolean(smtpPass) || Boolean(env.SMTP_PASS),
  };
}

settingsRouter.get("/", (_req, res) => {
  res.json(buildSettingsResponse());
});

const updateSettingsSchema = z.record(z.string(), z.string());

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const input = updateSettingsSchema.parse(req.body);
    for (const [key, value] of Object.entries(input)) {
      if (!value) continue;
      setSetting(key, value);
    }
    res.json(buildSettingsResponse());
  })
);

settingsRouter.delete("/theme", (_req, res) => {
  for (const key of THEME_SETTING_KEYS) deleteSetting(key);
  res.json(buildSettingsResponse());
});

settingsRouter.post(
  "/test-email",
  asyncHandler(async (req, res) => {
    const { to } = z.object({ to: z.string().email() }).parse(req.body);
    const result = await sendTestEmail(to);
    res.json(result);
  })
);
