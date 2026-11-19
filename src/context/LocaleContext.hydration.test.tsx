/**
 * LocaleContext hydration (#889)
 *
 * The server always formats in DEFAULT_LOCALE. The first client render must
 * produce the same text, or React reports a hydration mismatch on every
 * formatted number; the viewer's locale is applied after hydration.
 */

import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { TextEncoder } from "util";
import { formatCurrency } from "@/lib/utils";
import { LocaleProvider, useLocale } from "./LocaleContext";

function Amount() {
  const { locale, detected } = useLocale();
  return (
    <span data-detected={String(detected)}>{formatCurrency(1234.56, "USDC", locale)}</span>
  );
}

function App() {
  return (
    <LocaleProvider>
      <Amount />
    </LocaleProvider>
  );
}

describe("LocaleProvider hydration (#889)", () => {
  const originalLang = document.documentElement.getAttribute("lang");

  afterEach(() => {
    if (originalLang === null) document.documentElement.removeAttribute("lang");
    else document.documentElement.setAttribute("lang", originalLang);
  });

  it("hydrates a non-default viewer without a mismatch, then upgrades the locale", async () => {
    // react-dom/server needs TextEncoder, which jsdom does not provide.
    Object.assign(globalThis, { TextEncoder });
    const { renderToString } = await import("react-dom/server");

    const container = document.createElement("div");
    container.innerHTML = renderToString(<App />);
    const serverText = container.textContent;
    expect(container.querySelector("span")?.dataset.detected).toBe("false");

    // What localeInitScript does before React runs in a real browser.
    document.documentElement.setAttribute("lang", "de-DE");

    const onRecoverableError = jest.fn();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () => {
        hydrateRoot(container, <App />, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(container.querySelector("span")?.dataset.detected).toBe("true");
      expect(container.textContent).toBe(formatCurrency(1234.56, "USDC", "de-DE"));
      expect(container.textContent).not.toBe(serverText);
    } finally {
      consoleError.mockRestore();
    }
  });
});
