import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/issues", "/milestones", "/connect"];
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
