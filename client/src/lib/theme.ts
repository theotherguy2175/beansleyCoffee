import type { ThemeColors } from "@/types/api";

// Hex equivalents of the built-in warm-brown defaults in index.css — shown
// as the starting point in the admin color pickers so "no override yet"
// still shows a sensible color instead of black.
export const DEFAULT_THEME: Required<ThemeColors> = {
  theme_background: "#fdf9f5",
  theme_foreground: "#2b2117",
  theme_primary: "#5c3b23",
  theme_secondary: "#ede2d3",
  theme_accent: "#dcbb8a",
  theme_card: "#ffffff",
  theme_border: "#e5dccc",
};

// Maps each admin-editable color to the CSS custom property it overrides,
// and (where the color sits behind text) the paired *-foreground variable
// whose contrast we compute automatically rather than exposing yet another
// picker.
const CSS_VAR_MAP: Record<keyof ThemeColors, { var: string; foregroundVar?: string }> = {
  theme_background: { var: "--background" },
  theme_foreground: { var: "--foreground" },
  theme_primary: { var: "--primary", foregroundVar: "--primary-foreground" },
  theme_secondary: { var: "--secondary", foregroundVar: "--secondary-foreground" },
  theme_accent: { var: "--accent", foregroundVar: "--accent-foreground" },
  theme_card: { var: "--card", foregroundVar: "--card-foreground" },
  theme_border: { var: "--border" },
};

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

// WCAG relative luminance — picks black or white text, whichever contrasts
// better against the given background color, so a custom primary/accent/card
// color never ends up with unreadable button or card text.
export function contrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#1a1a1a";
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#1a1614" : "#fbf6ef";
}

export function isValidHex(value: string): boolean {
  return hexToRgb(value) !== null;
}

export function applyTheme(theme: ThemeColors | undefined, root: HTMLElement = document.documentElement) {
  for (const key of Object.keys(CSS_VAR_MAP) as (keyof ThemeColors)[]) {
    const value = theme?.[key];
    const { var: cssVar, foregroundVar } = CSS_VAR_MAP[key];
    if (!value) continue;
    root.style.setProperty(cssVar, value);
    if (foregroundVar) root.style.setProperty(foregroundVar, contrastColor(value));
  }
}
