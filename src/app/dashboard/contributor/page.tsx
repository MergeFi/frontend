import { fetchWithFallback } from "@/lib/api";
import { mockReputationProfiles, mockBounties } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { BountyCard } from "@/components/bounty/BountyCard";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ReputationProfile, Bounty } from "@/types";

export const metadata = {
  title: "Contributor Dashboard — MergeFi",
};

const CURRENT_HANDLE = "priyaeth";

export default async function ContributorDashboardPage() {
  const profile = await fetchWithFallback<ReputationProfile>(
    `/reputation/${CURRENT_HANDLE}`,
    mockReputationProfiles[CURRENT_HANDLE],
  );
  const bounties = await fetchWithFallback<Bounty[]>("/bounties", mockBounties);
  const mine = bounties.filter((b) => b.claimedBy === CURRENT_HANDLE);
  const available = bounties.filter((b) => b.status === "open");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">
        Welcome back, @{profile.handle}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Lifetime earnings"
          value={formatCurrency(profile.lifetimeEarnings)}
        />
        <StatCard label="Merged PRs" value={String(profile.mergedPRs)} />
        <StatCard
          label="Completion rate"
          value={formatPercent(profile.completionRate)}
        />
        <StatCard label="Active claims" value={String(mine.length)} />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">Your claims</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {mine.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
        {mine.length === 0 && (
          <p className="text-sm text-slate-500">
            You haven&apos;t claimed any issues yet.
          </p>
        )}
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">
        Recommended for you
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {available.slice(0, 4).map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </div>
  );
}
