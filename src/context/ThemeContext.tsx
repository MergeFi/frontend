"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCrossTabStorage } from "@/hooks/useCrossTabStorage";

type Theme = "light" | "dark";

const THEME_KEY = "mergefi_theme";

export const themeInitScript = `(function(){try{var stored=localStorage.getItem("${THEME_KEY}");var theme=stored||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");if(theme==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer reads the class themeInitScript already applied to
  // <html> synchronously, at mount/hydration time — not hardcoded to
  // "light" and corrected a render later, which made ThemeToggle briefly
  // show the wrong icon (backwards relative to the real theme) on every
  // page load in dark mode (#208). Guarded for SSR, where this Client
  // Component still executes once with no `document` available; the
  // client's own hydration render is what actually matters here and always
  // has `document` by then, since the inline script runs before React.
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );

  // Set by `toggle` so the effect below persists only a theme the user
  // actually chose — not the initial theme, a system-preference change, or a
  // value another tab already wrote (#886).
  const persistNextTheme = useRef(false);

  // The one owner of the <html> class and of the persisted value (#886):
  // state updaters must stay pure because React may replay them, so side
  // effects run here, after commit, exactly once per theme change.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!persistNextTheme.current) return;
    persistNextTheme.current = false;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Persistence is best-effort (e.g. private browsing may block it);
      // the toggle should still work for the current session either way.
    }
  }, [theme]);

  useEffect(() => {
    // Listen for system color scheme changes when no explicit preference is set.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only respond to system preference change if user hasn't explicitly set a theme.
      try {
        const stored = window.localStorage.getItem(THEME_KEY);
        if (!stored) {
          setTheme(e.matches ? "dark" : "light");
        }
      } catch {
        // Ignore errors reading localStorage.
      }
    };

    // Use addEventListener for broader browser compatibility.
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  // #887 — follow a theme toggled in another tab. The other tab already
  // persisted it, so this only updates state; removing the key falls back to
  // the system preference, matching themeInitScript.
  const handleCrossTabTheme = useCallback((value: string | null) => {
    if (value === "dark" || value === "light") {
      setTheme(value);
    } else if (value === null) {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);
  useCrossTabStorage(THEME_KEY, handleCrossTabTheme);

  // #885 — stable identity so the memoized provider value below only changes
  // when `theme` does. The updater is pure (#886); the effect above applies it.
  const toggle = useCallback(() => {
    persistNextTheme.current = true;
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // #885 — memoized value keeps consumers from re-rendering on every
  // ThemeProvider render.
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
