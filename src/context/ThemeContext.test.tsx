/**
 * ThemeContext.test.tsx (#908)
 *
 * Covers the provider itself (ThemeToggle.test.tsx mocks it): the lazy
 * initializer that reads the class themeInitScript put on <html> (#208), the
 * system-preference listener, and the toggle's persistence.
 */

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

const THEME_KEY = "mergefi_theme";

type ChangeListener = (event: MediaQueryListEvent) => void;

let listeners: ChangeListener[] = [];

function installMatchMedia() {
  listeners = [];
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.push(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => {
      listeners = listeners.filter((l) => l !== listener);
    },
  })) as unknown as typeof window.matchMedia;
}

function emitSystemChange(matches: boolean) {
  act(() => {
    for (const listener of listeners) {
      listener({ matches } as MediaQueryListEvent);
    }
  });
}

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle}>
      {theme}
    </button>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  installMatchMedia();
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("starts dark when themeInitScript already put the dark class on <html>", () => {
    document.documentElement.classList.add("dark");
    renderProvider();
    expect(screen.getByRole("button")).toHaveTextContent("dark");
  });

  it("starts light when <html> has no dark class", () => {
    renderProvider();
    expect(screen.getByRole("button")).toHaveTextContent("light");
  });

  it("follows a system preference change when nothing is stored", () => {
    renderProvider();
    emitSystemChange(true);
    expect(screen.getByRole("button")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("ignores a system preference change once the user chose a theme", () => {
    window.localStorage.setItem(THEME_KEY, "light");
    renderProvider();
    emitSystemChange(true);
    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggle persists the new theme and updates the <html> class", async () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    renderProvider();

    await userEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith(THEME_KEY, "dark");
    setItem.mockRestore();
  });

  it("removes the system listener on unmount", () => {
    const { unmount } = renderProvider();
    expect(listeners).toHaveLength(1);
    unmount();
    expect(listeners).toHaveLength(0);
  });

  it("throws when useTheme is used outside the provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useTheme must be used within a ThemeProvider");
  });
});
