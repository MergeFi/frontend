import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/sitemap";

/**
 * robots.txt — static crawler instructions for MergeFi.
 *
 * Points to the stable canonical sitemap URL (`/sitemap.xml`) rather than
 * dynamically awaiting backend-fetched sitemap chunks (#715). This guarantees
 * crawlers receive robots.txt instantly with zero database or API latency,
 * even when backend services are down or cold. The /sitemap.xml route and child
 * chunks handle dynamic generation and caching independently.
 *
 * Authenticated surfaces (/dashboard/, /auth/callback) remain disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/auth/callback"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

