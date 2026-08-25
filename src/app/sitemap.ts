import type { MetadataRoute } from "next";
import { fetchBounties, fetchReputationHandles } from "@/lib/api";
import { mockBounties, mockReputationProfiles } from "@/lib/mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/issues", "/milestones", "/connect"];
  const [bounties, reputationHandles] = await Promise.all([
    fetchBounties(mockBounties),
    fetchReputationHandles(Object.keys(mockReputationProfiles)),
  ]);

  const issueRoutes = bounties.map((bounty) => `/issues/${encodeURIComponent(bounty.id)}`);
  const reputationRoutes = reputationHandles.map(
    (handle) => `/reputation/${encodeURIComponent(handle)}`,
  );

  return [...staticRoutes, ...issueRoutes, ...reputationRoutes].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
