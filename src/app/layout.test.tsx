/**
 * @jest-environment node
 *
 * This test invokes middleware(), which uses the global `Response`/`Headers`
 * constructors, which jsdom (the default test environment) does not provide —
 * same reason as src/app/sitemaps/[id]/route.test.ts.
 */
import type { ReactElement, ReactNode } from "react";
import { NextRequest } from "next/server";
import RootLayout from "./layout";
import { middleware } from "../../middleware";
import { themeInitScript } from "@/context/ThemeContext";
import { localeInitScript } from "@/context/LocaleContext";

const mockStaticUuid = "00000000-0000-4000-8000-000000000000";
const mockKnownNonce = btoa(mockStaticUuid);

jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => (key === "x-nonce" ? mockKnownNonce : null),
  }),
}));

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("./globals.css", () => ({}));

function collectScripts(node: ReactNode, acc: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    for (const child of node) collectScripts(child, acc);
    return acc;
  }
  if (node && typeof node === "object" && "type" in node) {
    const el = node as ReactElement;
    if (el.type === "script") acc.push(el);
    collectScripts((el.props as { children?: ReactNode }).children, acc);
  }
  return acc;
}

it("applies the middleware nonce to both inline init scripts and to the CSP", async () => {
  jest
    .spyOn(crypto, "randomUUID")
    .mockReturnValue(mockStaticUuid as `${string}-${string}-${string}-${string}-${string}`);

  // CSP side: the nonce middleware generates is the one the CSP trusts.
  const response = middleware(new NextRequest("http://localhost:3000/dashboard"));
  const csp = response.headers.get("Content-Security-Policy");
  expect(csp).toContain(`'nonce-${mockKnownNonce}'`);

  // Script side: the nonce headers() exposes is the one both inline init
  // scripts carry. Checking either side alone passes while the other is
  // broken — the pair is what makes the plumbing verifiable (#833, #942).
  const layout = await RootLayout({ children: "content" });
  const scripts = collectScripts(layout);
  expect(scripts).toHaveLength(2);
  for (const script of scripts) {
    expect((script.props as { nonce?: string }).nonce).toBe(mockKnownNonce);
  }
  const inline = scripts.map(
    (s) => (s.props as { dangerouslySetInnerHTML?: { __html: string } }).dangerersSetInnerHTML,
  );
  const bodies = scripts.map(
    (s) => (s.props as { dangerouslySetInnerHTML?: { __html: string } }).dangerouslySetInnerHTML?.__html,
  );
  expect(bodies).toContain(themeInitScript);
  expect(bodies).toContain(localeInitScript);
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
