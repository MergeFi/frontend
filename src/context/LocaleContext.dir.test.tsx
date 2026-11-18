/**
 * LocaleContext.dir.test.tsx (#890, #891)
 *
 * `dir` must always be set explicitly — never left over from an earlier RTL
 * locale — by both the pre-hydration init script and the provider, and the
 * provider must re-resolve when the localStorage override changes in another
 * tab or the browser's language list changes.
 */

import { act, render, screen } from "@testing-library/react";
import { LOCALE_STORAGE_KEY } from "@/lib/locale";
import { LocaleProvider, localeInitScript, useLocale } from "./LocaleContext";

function runInitScript() {
  // The script is a self-contained IIFE string injected into <head>.
  new Function(localeInitScript)();
}

function Probe() {
  const { locale, direction } = useLocale();
  return <p data-testid="probe">{`${locale} ${direction}`}</p>;
}

const html = document.documentElement;

afterEach(() => {
  window.localStorage.clear();
  html.removeAttribute("lang");
  html.removeAttribute("dir");
  jest.restoreAllMocks();
});

describe("localeInitScript (#890)", () => {
  it("sets dir=rtl for an RTL override", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "ar");
    runInitScript();
    expect(html.getAttribute("lang")).toBe("ar");
    expect(html.getAttribute("dir")).toBe("rtl");
  });

  it("resets dir to ltr when switching away from an RTL locale", () => {
    html.setAttribute("dir", "rtl");
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    runInitScript();
    expect(html.getAttribute("lang")).toBe("en-US");
    expect(html.getAttribute("dir")).toBe("ltr");
  });
});

describe("LocaleProvider", () => {
  it("writes lang and dir for the resolved locale (#890)", () => {
    html.setAttribute("dir", "rtl");
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("en-US ltr");
    expect(html.getAttribute("dir")).toBe("ltr");
  });

  it("follows an override written by another tab (#891)", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    act(() => {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, "ar");
      window.dispatchEvent(new StorageEvent("storage", { key: LOCALE_STORAGE_KEY }));
    });

    expect(screen.getByTestId("probe")).toHaveTextContent("ar rtl");
    expect(html.getAttribute("lang")).toBe("ar");
    expect(html.getAttribute("dir")).toBe("rtl");
  });

  it("ignores storage events for unrelated keys (#891)", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    act(() => {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, "ar");
      window.dispatchEvent(new StorageEvent("storage", { key: "something_else" }));
    });

    expect(screen.getByTestId("probe")).toHaveTextContent("en-US ltr");
  });

  it("re-resolves when the browser's language list changes (#891)", () => {
    const languages = jest.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("en-US ltr");

    languages.mockReturnValue(["he-IL"]);
    act(() => {
      window.dispatchEvent(new Event("languagechange"));
    });

    expect(screen.getByTestId("probe")).toHaveTextContent("he-IL rtl");
    expect(html.getAttribute("dir")).toBe("rtl");
  });
});
