import type { Metadata } from "next";
import { fetchReputationByUsername } from "@/lib/api";
import { mockReputationProfiles } from "@/lib/mock-data";
import { profileIsIndexable } from "@/lib/seo-policy";
import { DataSourceNotice } from "@/components/ui/DataSourceNotice";
import { ReputationProfileView } from "./ReputationProfileView";
import { ReputationClientFallback } from "./ReputationClientFallback";

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
    return {
      title: `@${handle} | MergeFi`,
      robots: { index: false, follow: false },
    };
  }

  const title = `@${profile.handle} | MergeFi`;
  const description = `${profile.mergedPRs} merged PRs · ${profile.languages.slice(0, 3).join(", ")}`;

  return {
    title,
    description,
    robots: profileIsIndexable(profile)
      ? { index: true, follow: true }
      : { index: false, follow: false },
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
  const { data: profile, source } = await fetchReputationByUsername(handle, mockFallback);

  if (!profile) {
    return <ReputationClientFallback handle={handle} />;
  }

  return (
    <>
      {source === "mock" && <DataSourceNotice className="mb-6" />}
      <ReputationProfileView profile={profile} />
    </>
  );
}
