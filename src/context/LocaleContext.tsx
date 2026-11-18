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
 * always formatted in {@link DEFAULT_LOCALE}. If the first *client* render
 * used the viewer's locale, React would report a hydration mismatch on every
 * number on the page. So the provider deliberately starts at
 * {@link DEFAULT_LOCALE} — byte-identical to what the server sent — and
 * upgrades to the viewer's locale in a post-mount effect. The visible cost is
 * that numbers re-format once, after mount. The alternative (a hydration
 * error, or permanently-wrong en-US) is worse.
 *
 * `lang` and `dir` do NOT have that constraint, because they are attributes
 * on `<html>` and are set by {@link localeInitScript} before React hydrates —
 * the same technique ThemeContext already uses for the dark-mode class. They
 * are therefore correct on the very first painted frame.
 */

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_LOCALE,
  isRTLLocale,
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
export const localeInitScript = `(function(){try{var l=null;try{l=localStorage.getItem("mergefi_locale");}catch(e){}if(!l){var n=navigator.languages||[navigator.language];l=n&&n.length?n[0]:null;}if(!l)return;var r=["ar","arc","dv","fa","he","khw","ks","ps","sd","ur","yi"];var b=l.split("-")[0].toLowerCase();document.documentElement.setAttribute("lang",l);if(r.indexOf(b)!==-1)document.documentElement.setAttribute("dir","rtl");}catch(e){}})();`;

// Re-render if the browser's language preference changes after hydration.
function subscribeLocale(onChange: () => void): () => void {
  window.addEventListener("languagechange", onChange);
  return () => window.removeEventListener("languagechange", onChange);
}

// `localeInitScript` has already written the authoritative locale onto
// `<html lang>`; it is absent in jsdom and non-browser renders, hence the
// resolveLocale() fallback.
function readClientLocale(): string {
  return normalizeLocale(document.documentElement.getAttribute("lang") ?? resolveLocale());
}

function readServerLocale(): string {
  return DEFAULT_LOCALE;
}

function readDetectedClient(): boolean {
  return true;
}

function readDetectedServer(): boolean {
  return false;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  /* The first client render must format exactly what the server emitted
     (#889). Reading the viewer's locale in a lazy initializer made every
     formatted number differ between server HTML and the first client render —
     a hydration mismatch on every amount, percentage and count for any
     non-default viewer. `useSyncExternalStore` renders the server snapshot
     (DEFAULT_LOCALE) during hydration and then re-renders once with the
     client snapshot, which is the post-mount upgrade the header describes. */
  const locale = useSyncExternalStore(subscribeLocale, readClientLocale, readServerLocale);

  /* `detected` is false under SSR and on the hydrating render, true once the
     viewer's locale is in use. */
  const detected = useSyncExternalStore(subscribeLocale, readDetectedClient, readDetectedServer);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      detected,
      direction: isRTLLocale(locale) ? "rtl" : "ltr",
    }),
    [locale, detected],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  // Deliberately non-throwing: a missing provider must never take down a
  // render. `lib/locale.ts` is the source of truth and works standalone, so
  // the correct degradation is simply "assume the default locale".
  return ctx ?? { locale: DEFAULT_LOCALE, detected: false, direction: "ltr" };
}
