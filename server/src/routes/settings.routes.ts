import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.js";
import { getAllSettings, setSetting, SETTINGS_KEYS } from "../services/settings.service.js";
import { getMakerNotificationEmail, sendTestEmail } from "../services/email.service.js";
import { env } from "../env.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";

export const settingsRouter = Router();

settingsRouter.use(requireRole("admin"));

function buildSettingsResponse() {
  const all = getAllSettings();
  const { [SETTINGS_KEYS.SMTP_PASS]: smtpPass, ...rest } = all;
  return {
    ...rest,
    maker_notification_email: rest[SETTINGS_KEYS.MAKER_NOTIFICATION_EMAIL] ?? env.MAKER_NOTIFICATION_EMAIL ?? "",
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

settingsRouter.post(
  "/test-email",
  asyncHandler(async (req, res) => {
    const { to } = z.object({ to: z.string().email().optional() }).parse(req.body);
    const recipient = to || getMakerNotificationEmail();
    if (!recipient) throw new HttpError(400, "No recipient email — set a maker notification email first, or provide one");
    const result = await sendTestEmail(recipient);
    res.json(result);
  })
);
