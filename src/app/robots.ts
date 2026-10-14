import type { MetadataRoute } from "next";

/**
 * robots.txt — the third surface that has to agree with the indexability
 * policy in src/lib/seo-policy.ts (the other two being the sitemap and the
 * per-page `robots` metadata on /reputation/[handle]).
 *
 * Note what is deliberately NOT here: no `Disallow: /reputation/`. Profiles
 * are public and linkable; the ones that haven't opted into indexing carry
 * `noindex, nofollow` in their own page metadata. Blocking them in robots.txt
 * would prevent crawlers from ever fetching the page, which means they would
 * never see that noindex tag — leaving already-indexed URLs in the index
 * indefinitely. Letting crawlers read the page is what makes de-indexing work.
 *
 * Dashboard/auth routes stay disallowed: they are per-user surfaces with no
 * value in a search index, and /auth/callback carries a short-lived token in
 * its query string.
 */
// Static robots.txt — a crawler hits this FIRST, so it must never await the
// backend. sitemapUrls() calls the API (up to a 20s timeout each on a cold
// module cache), and a slow/unreachable backend made crawlers treat
// robots.txt timeouts as a reason to back off the whole site (#715). Point at
// the stable /sitemap.xml index and let that route do the dynamic work.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/auth/callback"],
    },
    // The single stable index URL — /sitemap.xml already redirects to the
    // generated sitemap set. Crawlers get a fast static answer; the sitemap
    // route absorbs the backend latency instead.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
