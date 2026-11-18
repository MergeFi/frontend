/**
 * LocaleContext.test.tsx (#910)
 *
 * Pins what the provider actually does on the first client render: it reads
 * the locale `localeInitScript` wrote onto `<html lang>` (falling back to
 * resolveLocale() when the script did not run), derives the text direction,
 * follows `languagechange`, and degrades to DEFAULT_LOCALE with no provider.
 */

import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from "@/lib/locale";
import { LocaleProvider, localeInitScript, useLocale } from "./LocaleContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

afterEach(() => {
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("dir");
  window.localStorage.clear();
});

describe("LocaleProvider", () => {
  it("uses the locale already written onto <html lang> on the first render", () => {
    document.documentElement.setAttribute("lang", "de-DE");

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current).toEqual({ locale: "de-DE", detected: true, direction: "ltr" });
  });

  it("reports a right-to-left direction for an RTL locale", () => {
    document.documentElement.setAttribute("lang", "ar");

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("ar");
    expect(result.current.direction).toBe("rtl");
  });

  it("falls back to resolveLocale() when the init script did not set <html lang>", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr-FR");

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("fr-FR");
  });

  it("follows a languagechange event", () => {
    document.documentElement.setAttribute("lang", "de-DE");
    const { result } = renderHook(() => useLocale(), { wrapper });

    window.localStorage.setItem(LOCALE_STORAGE_KEY, "ja-JP");
    act(() => {
      window.dispatchEvent(new Event("languagechange"));
    });

    expect(result.current.locale).toBe("ja-JP");
  });

  it("stops listening for languagechange after unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useLocale(), { wrapper });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("languagechange", expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe("useLocale without a provider", () => {
  it("returns the documented DEFAULT_LOCALE fallback instead of throwing", () => {
    const { result } = renderHook(() => useLocale());

    expect(result.current).toEqual({
      locale: DEFAULT_LOCALE,
      detected: false,
      direction: "ltr",
    });
  });
});

describe("localeInitScript", () => {
  it("writes the stored locale and RTL direction onto <html>", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "he-IL");

    new Function(localeInitScript)();

    expect(document.documentElement.getAttribute("lang")).toBe("he-IL");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
  });
});
