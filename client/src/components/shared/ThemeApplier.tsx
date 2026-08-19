import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { applyTheme } from "@/lib/theme";

// Applies the admin-configured theme colors (if any) as CSS custom property
// overrides on :root. Renders nothing — mounted once, high in the tree, so
// every page (including logged-out ones like /login) picks up the theme.
export function ThemeApplier() {
  const { data: theme } = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
