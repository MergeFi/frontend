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
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Reflects the class the no-flash init script already applied to <html>.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");

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
