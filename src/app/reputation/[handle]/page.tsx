import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchReputationByUsername } from "@/lib/api";
import { mockReputationProfiles } from "@/lib/mock-data";
import { ReputationProfileView } from "./ReputationProfileView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const mockFallback =
    Object.values(mockReputationProfiles).find(
      (p) => p.handle.toLowerCase() === handle.toLowerCase(),
    ) ?? null;
  const { data: profile } = await fetchReputationByUsername(handle, mockFallback);

  if (!profile) {
    return { title: "Profile not found | MergeFi" };
  }

  const title = `@${profile.handle} | MergeFi`;
  const description = `${profile.mergedPRs} merged PRs · ${profile.languages.slice(0, 3).join(", ")}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/reputation/${handle}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ReputationPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const mockFallback =
    Object.values(mockReputationProfiles).find(
      (p) => p.handle.toLowerCase() === handle.toLowerCase(),
    ) ?? null;
  const { data: profile } = await fetchReputationByUsername(handle, mockFallback);

  if (!profile) notFound();

  return <ReputationProfileView profile={profile} />;
}
