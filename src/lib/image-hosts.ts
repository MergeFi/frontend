/**
 * Single source of truth for the external image hosts this app loads from
 * (#940). Both CSP `img-src` lists (next.config.ts and middleware.ts) and
 * next.config.ts's `images.remotePatterns` are derived from here, so the three
 * can no longer drift apart. A host in `remotePatterns` but missing from
 * `img-src` is blocked by the browser with only a console violation; a host in
 * `img-src` but missing from `remotePatterns` makes `next/image` throw at
 * request time — neither shows up in a build.
 *
 * Relative imports only: next.config.ts and middleware.ts load this outside
 * the normal module graph, where the `@/` alias isn't guaranteed to resolve.
 */

/** Hosts `next/image` may fetch and optimize (GitHub avatars). */
export const OPTIMIZED_IMAGE_HOSTS: readonly string[] = ["avatars.githubusercontent.com"];

/**
 * Hosts that images inside rendered issue markdown are served from. These are
 * plain `<img>` loads, never passed to `next/image`, so they need a CSP entry
 * but no `remotePatterns` entry.
 */
export const MARKDOWN_IMAGE_HOSTS: readonly string[] = [
  "github.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
  "raw.githubusercontent.com",
  "camo.githubusercontent.com",
];

/** The `img-src` CSP directive shared by next.config.ts and middleware.ts. */
export function imgSrcDirective(): string {
  const hosts = [...OPTIMIZED_IMAGE_HOSTS, ...MARKDOWN_IMAGE_HOSTS].map(
    (host) => `https://${host}`,
  );
  return ["img-src", "'self'", ...hosts, "data:"].join(" ");
}

/** `images.remotePatterns` for next.config.ts. */
export function imageRemotePatterns(): { protocol: "https"; hostname: string }[] {
  return OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname }));
}
