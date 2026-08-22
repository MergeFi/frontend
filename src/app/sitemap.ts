import type { MetadataRoute } from "next";
import { mockBounties, mockReputationProfiles } from "@/lib/mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mergefi.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/issues", "/milestones", "/connect"];
  const staticEntries = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));

  const issueEntries = mockBounties.map((b) => ({
    url: `${BASE_URL}/issues/${b.id}`,
    lastModified: new Date(),
  }));

  const reputationEntries = Object.keys(mockReputationProfiles).map((handle) => ({
    url: `${BASE_URL}/reputation/${handle}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...issueEntries, ...reputationEntries];
}
