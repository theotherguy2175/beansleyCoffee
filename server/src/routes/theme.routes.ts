import { Router } from "express";
import { getAllSettings, THEME_SETTING_KEYS } from "../services/settings.service.js";

export const themeRouter = Router();

// Public — every visitor (logged in or not) needs the current theme to
// render the page correctly, not just admins.
themeRouter.get("/", (_req, res) => {
  const all = getAllSettings();
  const theme = Object.fromEntries(THEME_SETTING_KEYS.filter((key) => all[key]).map((key) => [key, all[key]]));
  res.json(theme);
});
