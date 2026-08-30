import type { MetadataRoute } from "next";
import { fetchBounties } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.app";

// Profile routes (/reputation/<handle>) are intentionally NOT listed here
// (#19): those pages render real GitHub identities next to lifetime
// earnings, and a crawlable enumeration of them would amount to an
// earnings directory tied to real names. There is no per-user opt-in flag
// yet, so the only defensible default is to leave profiles out of the
// sitemap entirely and mark the pages noindex (see
// reputation/[handle]/generateMetadata). If an explicit opt-in field lands
// in the backend later, re-add only those handles here — served through
// generateSitemaps() chunking well before the 50,000-URL / 50MB per-file
// limits, with this route's revalidate caching keeping crawlers off the
// backend per request.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/issues", "/milestones", "/connect"];
  // fetchBounties falls back to the mock data when the backend is
  // unreachable, so crawlers get a valid sitemap instead of a 5xx during
  // an outage.
  const { data: bounties } = await fetchBounties(mockBounties);

  const issueRoutes = bounties.map((bounty) => `/issues/${encodeURIComponent(bounty.id)}`);

  return [...staticRoutes, ...issueRoutes].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
