"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    // Listen for system color scheme changes when no explicit preference is set.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only respond to system preference change if user hasn't explicitly set a theme.
      try {
        const stored = window.localStorage.getItem(THEME_KEY);
        if (!stored) {
          const newTheme = e.matches ? "dark" : "light";
          setTheme(newTheme);
          document.documentElement.classList.toggle("dark", e.matches);
        }
      } catch {
        // Ignore errors reading localStorage.
      }
    };

    // Use addEventListener for broader browser compatibility.
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Persistence is best-effort (e.g. private browsing may block it);
        // the toggle should still work for the current session either way.
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
