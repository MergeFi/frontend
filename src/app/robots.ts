import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/auth/callback"],
      // /reputation/<handle> stays allowed on purpose (#19): profile pages
      // carry their own noindex metadata, which is the correct tool —
      // disallowing here would just stop crawlers from reading that
      // directive while still letting the URL appear bare in results.
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
