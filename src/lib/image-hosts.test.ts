/**
 * @jest-environment node
 *
 * Invokes middleware(), which needs the global `Response`/`Headers`
 * constructors that jsdom does not provide (same as src/app/layout.test.tsx).
 *
 * #940 — the CSP `img-src` lists in next.config.ts and middleware.ts and
 * next.config.ts's `images.remotePatterns` must agree: every host next/image
 * may optimize must also be allowed by both CSPs.
 */
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import { middleware } from "../../middleware";
import { imgSrcDirective, OPTIMIZED_IMAGE_HOSTS } from "./image-hosts";

function imgSrcOf(csp: string | null | undefined): string[] {
  const directive = (csp ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("img-src "));
  return directive ? directive.split(/\s+/).slice(1) : [];
}

async function nextConfigCsp(): Promise<string | undefined> {
  const rules = (await nextConfig.headers?.()) ?? [];
  return rules
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === "Content-Security-Policy")?.value;
}

describe("image host allowlists (#940)", () => {
  it("next.config.ts and middleware.ts send the same img-src", async () => {
    const middlewareCsp = middleware(new NextRequest("http://localhost:3000/")).headers.get(
      "Content-Security-Policy",
    );

    expect(imgSrcOf(middlewareCsp)).toEqual(imgSrcOf(await nextConfigCsp()));
    expect(imgSrcOf(middlewareCsp)).toEqual(imgSrcOf(imgSrcDirective()));
  });

  it("every remotePatterns host is allowed by the CSP img-src", async () => {
    const allowed = imgSrcOf(await nextConfigCsp());
    const patterns = nextConfig.images?.remotePatterns ?? [];

    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      const { protocol, hostname } = pattern as { protocol?: string; hostname: string };
      expect(allowed).toContain(`${protocol ?? "https"}://${hostname}`);
    }
  });

  it("remotePatterns lists exactly the optimized hosts", () => {
    const hostnames = (nextConfig.images?.remotePatterns ?? []).map(
      (pattern) => (pattern as { hostname: string }).hostname,
    );

    expect(hostnames).toEqual([...OPTIMIZED_IMAGE_HOSTS]);
  });
});
