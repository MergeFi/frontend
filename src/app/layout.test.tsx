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
});
