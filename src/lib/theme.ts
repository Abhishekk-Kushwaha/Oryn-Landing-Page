export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "forge_theme";

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  return "light";
}

export function persistTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body;
  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  body.classList.toggle("dark", isDark);
  root.style.colorScheme = theme;
  body.style.colorScheme = theme;
}

export function initializeTheme() {
  const theme = readStoredTheme();
  applyTheme(theme);
  return theme;
}
