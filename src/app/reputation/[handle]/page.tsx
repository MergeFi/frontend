import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchReputationByUsername } from "@/lib/api";
import { mockReputationProfiles } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

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
    return { title: "Profile not found | MergeFi", robots: { index: false, follow: false } };
  }

  const title = `@${profile.handle} | MergeFi`;
  const description = `${profile.mergedPRs} merged PRs · ${profile.languages.slice(0, 3).join(", ")}`;

  return {
    title,
    description,
    // Profiles are opt-in only as far as search engines go (#19): they
    // render real GitHub identities next to lifetime earnings, so until a
    // per-user public-profile flag exists in the backend, every profile
    // page — not just its absence from the sitemap — tells crawlers not to
    // index it. Links still flow (follow) so the bounty board keeps its
    // graph value.
    robots: { index: false, follow: true },
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
  // mockReputationProfiles is keyed by exact-case username; look it up
  // case-insensitively too, matching fetchReputationByUsername's own fix
  // for the same "GitHub usernames are case-insensitive" issue (#245).
  const mockFallback =
    Object.values(mockReputationProfiles).find(
      (p) => p.handle.toLowerCase() === handle.toLowerCase(),
    ) ?? null;
  const { data: profile } = await fetchReputationByUsername(handle, mockFallback);

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-4">
        <Avatar seed={profile.handle} src={profile.avatarUrl} size={64} className="rounded-2xl" />
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            @{profile.handle}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.organizations.map((org) => (
              <Badge key={org}>{org}</Badge>
            ))}
            {profile.organizations.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                No contributions recorded yet.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Lifetime earnings"
          value={profile.lifetimeEarnings}
          format="currency"
        />
        <StatCard
          label="Merged PRs"
          value={profile.mergedPRs}
          format="count"
        />
        <StatCard
          label="Completion rate"
          value={profile.completionRate}
          format="percent"
        />
        <StatCard
          label="On-time delivery"
          value={profile.onTimeDeliveryRate}
          format="percent"
        />
      </div>

      <div className="mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-slate-900 dark:text-white">Languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <Badge key={lang}>{lang}</Badge>
            ))}
            {profile.languages.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500">No data yet.</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        Average review time: {profile.avgReviewTimeHours.toFixed(1)}h
      </p>
    </div>
  );
}
