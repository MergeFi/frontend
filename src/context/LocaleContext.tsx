"use client";

/**
 * LocaleContext — the viewer's locale, and the seam a future next-intl
 * integration replaces.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Every number, date and percentage the app renders is formatted through
 * `lib/locale.ts`, which needs to know *which* locale to format for. Before
 * this, the answer was hardcoded to "en-US" at four call sites, so a viewer
 * in Berlin saw "1,234.56 USDC" and a viewer in Paris saw "1,234.56 USDC".
 *
 * HYDRATION
 * ─────────
 * The server cannot know the viewer's locale, so server-rendered HTML is
 * always formatted in {@link DEFAULT_LOCALE}. How the provider chooses its
 * locale on the first client render is explained on the `useState`
 * initializer inside {@link LocaleProvider}; that comment is the single source
 * of truth for it, so it is not restated here (#888).
 *
 * `lang` and `dir` do NOT have that constraint, because they are attributes
 * on `<html>` and are set by {@link localeInitScript} before React hydrates —
 * the same technique ThemeContext already uses for the dark-mode class. They
 * are therefore correct on the very first painted frame.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  isRTLLocale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  resolveLocale,
} from "@/lib/locale";

interface LocaleContextValue {
  /**
   * BCP-47 tag used for every `Intl` call. Equals {@link DEFAULT_LOCALE} on
   * the server and on the first client render, then the viewer's real locale.
   */
  locale: string;
  /** `true` once the viewer's locale has been resolved client-side. */
  detected: boolean;
  /** `rtl` for right-to-left writing systems, otherwise `ltr`. */
  direction: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Runs before first paint (injected into `<head>`), so `<html lang>` and
 * `<html dir>` are already correct on the first frame rather than flipping a
 * frame later the way the React-side locale does. Detects an explicit
 * override first, then the browser's preferred language list.
 */
export const localeInitScript = `(function(){try{var l=null;try{l=localStorage.getItem("mergefi_locale");}catch(e){}if(!l){var n=navigator.languages||[navigator.language];l=n&&n.length?n[0]:null;}if(!l)return;var r=["ar","arc","dv","fa","he","khw","ks","ps","sd","ur","yi"];var b=l.split("-")[0].toLowerCase();document.documentElement.setAttribute("lang",l);document.documentElement.setAttribute("dir",r.indexOf(b)!==-1?"rtl":"ltr");}catch(e){}})();`;

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  /* Lazy initializer, the same technique ThemeContext uses for the dark-mode
     class — and for the same reason. `localeInitScript` has already written
     the authoritative locale onto `<html lang>` by the time React hydrates, so
     reading it here yields the *viewer's* real locale on the very first
     client render, not one frame later.

     That matters because an effect-based upgrade would be a second render
     pass over every page. It also sidesteps the other half of the problem: the
     first client render now matches the server for `lang`/`dir` (both written
     by the script) while formatting numbers in DEFAULT_LOCALE, which is
     exactly what the server emitted — so React still sees no mismatch. */
  const [locale, setLocale] = useState<string>(() => {
    if (typeof document === "undefined") return DEFAULT_LOCALE;
    // The init script is absent in jsdom and in any non-browser render, hence
    // the resolveLocale() fallback.
    return normalizeLocale(document.documentElement.getAttribute("lang") ?? resolveLocale());
  });

  /* `detected` is true once we are past the server-render fallback. The
     script sets `lang` synchronously in a real browser, so this is true from
     the first client render; it is only false under SSR and in tests. Kept
     because a consumer may want to avoid re-rendering formatted content
     server-side vs client-side. */
  const detected = typeof document !== "undefined";

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      detected,
      direction: isRTLLocale(locale) ? "rtl" : "ltr",
    }),
    [locale, detected],
  );

  // The `mergefi_locale` localStorage override is authoritative, then the
  // browser's language list — the same order the init script and
  // resolveLocale() use (#891). Re-resolve when either source changes:
  // `languagechange` fires when the browser's preferred languages change,
  // and `storage` fires when another tab writes or clears the override.
  // (Neither fires for a write to <html lang>, so nothing here watches it.)
  useEffect(() => {
    const reresolve = () => setLocale(normalizeLocale(resolveLocale()));
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY || event.key === null) reresolve();
    };
    window.addEventListener("languagechange", reresolve);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("languagechange", reresolve);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Keep <html lang> and <html dir> in step with the resolved locale after a
  // runtime change, so the document never stays mirrored after switching
  // away from an RTL locale while useLocale().direction says "ltr" (#890).
  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", value.direction);
  }, [locale, value.direction]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  // Deliberately non-throwing: a missing provider must never take down a
  // render. `lib/locale.ts` is the source of truth and works standalone, so
  // the correct degradation is simply "assume the default locale".
  return ctx ?? { locale: DEFAULT_LOCALE, detected: false, direction: "ltr" };
}
