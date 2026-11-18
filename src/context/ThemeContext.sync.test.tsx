/**
 * ThemeContext side effects (#886) and cross-tab sync (#887).
 */

import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

const THEME_KEY = "mergefi_theme";

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
    <StrictMode>
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    </StrictMode>,
  );
}

function dispatchStorageEvent(newValue: string | null) {
  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", { key: THEME_KEY, newValue, storageArea: window.localStorage }),
    );
  });
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ThemeProvider toggle (#886)", () => {
  it("applies the class and persists once per click, even under Strict Mode", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "light" }));

    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith(THEME_KEY, "dark");

    fireEvent.click(screen.getByRole("button", { name: "dark" }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("does not persist a theme the user never chose", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    renderProvider();

    expect(setItem).not.toHaveBeenCalled();
  });
});

describe("ThemeProvider cross-tab sync (#887)", () => {
  it("follows a theme toggled in another tab without re-persisting it", () => {
    renderProvider();
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    dispatchStorageEvent("dark");

    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("falls back to the system preference when another tab clears the key", () => {
    renderProvider();
    dispatchStorageEvent("dark");

    dispatchStorageEvent(null);

    expect(screen.getByRole("button", { name: "light" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("ignores an unrecognised value", () => {
    renderProvider();

    dispatchStorageEvent("purple");

    expect(screen.getByRole("button", { name: "light" })).toBeInTheDocument();
  });
});
