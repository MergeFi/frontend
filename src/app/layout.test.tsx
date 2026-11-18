/**
 * @jest-environment node
 *
 * layout.test.tsx (#920)
 *
 * The root layout reads the CSP nonce from `headers()` and must apply it to
 * both inline init scripts (a script without the nonce is blocked by the
 * nonce-based CSP), fixes the provider nesting order that every
 * useLocale/useTheme/useAuth/useWallet consumer depends on, and sets the
 * `<html lang>`/`dir` defaults the init script upgrades. Rendered to static
 * markup in a node environment because jsdom cannot mount a second <html>.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { headers } from "next/headers";
import RootLayout from "./layout";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans-var" }),
  Geist_Mono: () => ({ variable: "font-mono-var" }),
}));
jest.mock("./globals.css", () => ({}));
jest.mock("@/components/layout/Navbar", () => ({ Navbar: () => <nav>navbar</nav> }));
jest.mock("@/components/layout/Footer", () => ({ Footer: () => <footer>footer</footer> }));
jest.mock("@/context/LocaleContext", () => ({
  localeInitScript: "/*locale-init*/",
  LocaleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="locale">{children}</div>
  ),
}));
jest.mock("@/context/ThemeContext", () => ({
  themeInitScript: "/*theme-init*/",
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="theme">{children}</div>
  ),
}));
jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="auth">{children}</div>
  ),
}));
jest.mock("@/context/WalletContext", () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-provider="wallet">{children}</div>
  ),
}));

const mockHeaders = headers as jest.MockedFunction<typeof headers>;

async function renderLayout(requestHeaders: Record<string, string> = {}) {
  mockHeaders.mockResolvedValue(new Headers(requestHeaders) as never);
  const element = await RootLayout({ children: <p>page body</p> });
  return renderToStaticMarkup(element);
}

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies the nonce from headers() to both inline init scripts", async () => {
    const markup = await renderLayout({ "x-nonce": "abc123" });

    expect(markup).toContain('<script nonce="abc123">/*theme-init*/</script>');
    expect(markup).toContain('<script nonce="abc123">/*locale-init*/</script>');
  });

  it("renders the init scripts without a nonce attribute when none is set", async () => {
    const markup = await renderLayout();

    expect(markup).toContain("<script>/*theme-init*/</script>");
    expect(markup).toContain("<script>/*locale-init*/</script>");
    expect(markup).not.toContain("nonce=");
  });

  it("nests providers locale > theme > auth > wallet around the page", async () => {
    const markup = await renderLayout();
    const order = [
      'data-provider="locale"',
      'data-provider="theme"',
      'data-provider="auth"',
      'data-provider="wallet"',
      "<nav>navbar</nav>",
      "page body",
      "<footer>footer</footer>",
    ].map((needle) => markup.indexOf(needle));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("renders the page inside the skip-link target", async () => {
    const markup = await renderLayout();

    expect(markup).toContain('href="#main-content"');
    expect(markup).toMatch(/<main id="main-content"[^>]*><p>page body<\/p><\/main>/);
  });

  it('defaults <html> to lang="en" dir="ltr" with the font variables', async () => {
    const markup = await renderLayout();

    expect(markup).toMatch(/<html lang="en" dir="ltr"/);
    expect(markup).toContain("font-sans-var font-mono-var");
  });
});
