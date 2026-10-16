import type { MetadataRoute } from "next";
import { fetchBounties, fetchReputationHandles } from "@/lib/api";
import { mockBounties, mockReputationProfiles } from "@/lib/mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/issues", "/milestones", "/connect"];
  const [bountiesRes, handlesRes] = await Promise.all([
    fetchBounties(mockBounties),
    fetchReputationHandles(Object.keys(mockReputationProfiles)),
  ]);

  // #635 — static routes have no meaningful "last modified" timestamp;
  // omit lastModified so crawlers don't see a fake change date on every rebuild.
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
  }));

  // Bounty pages use the bounty's updatedAt timestamp so crawlers can
  // tell what actually changed between rebuilds.
  const issueEntries: MetadataRoute.Sitemap = bountiesRes.data.map((bounty) => ({
    url: `${BASE_URL}/issues/${encodeURIComponent(bounty.id)}`,
    lastModified: new Date(
      (bounty as { updatedAt?: string }).updatedAt ?? Date.now(),
    ),
  }));

  // Reputation pages use the snapshot's computedAt timestamp when available.
  const reputationEntries: MetadataRoute.Sitemap = handlesRes.data.map(
    (handle) => {
      const profile = mockReputationProfiles[handle];
      const computedAt = (profile as { computedAt?: string } | undefined)
        ?.computedAt;
      return {
        url: `${BASE_URL}/reputation/${encodeURIComponent(handle)}`,
        ...(computedAt ? { lastModified: new Date(computedAt) } : {}),
      };
    },
  );

  return [...staticEntries, ...issueEntries, ...reputationEntries];
}
