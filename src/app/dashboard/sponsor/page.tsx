import { fetchWithFallback } from "@/lib/api";
import { mockSponsorSummary, mockBounties } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { BountyCard } from "@/components/bounty/BountyCard";
import { formatCurrency } from "@/lib/utils";
import type { SponsorSummary, Bounty } from "@/types";

export const metadata = {
  title: "Sponsor Dashboard — MergeFi",
};

export default async function SponsorDashboardPage() {
  const summary = await fetchWithFallback<SponsorSummary>(
    "/sponsors/me/summary",
    mockSponsorSummary,
  );
  const bounties = await fetchWithFallback<Bounty[]>("/bounties", mockBounties);
  const active = bounties.filter((b) =>
    ["open", "claimed", "in_review"].includes(b.status),
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">{summary.name}</h1>
      <p className="mt-2 text-slate-400">
        Track spending, active bounties, and remaining budget across the
        repositories you fund.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total funded"
          value={formatCurrency(summary.totalFunded)}
        />
        <StatCard label="Active bounties" value={String(summary.activeBounties)} />
        <StatCard
          label="Budget remaining"
          value={formatCurrency(summary.budgetRemaining)}
        />
        <StatCard label="Repositories" value={String(summary.repos.length)} />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">
        Active bounties
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {active.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </div>
  );
}
