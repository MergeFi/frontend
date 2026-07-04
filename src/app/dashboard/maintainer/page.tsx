import { fetchWithFallback } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { Bounty } from "@/types";

export const metadata = {
  title: "Maintainer Dashboard — MergeFi",
};

export default async function MaintainerDashboardPage() {
  const bounties = await fetchWithFallback<Bounty[]>("/bounties", mockBounties);
  const needsReview = bounties.filter((b) => b.status === "in_review");
  const open = bounties.filter((b) => b.status === "open");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">
        Maintainer dashboard
      </h1>
      <p className="mt-2 text-slate-400">
        Create bounties from your GitHub issues and approve completed work to
        release escrowed payments.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Open bounties" value={String(open.length)} />
        <StatCard label="Awaiting review" value={String(needsReview.length)} />
        <StatCard
          label="Total value in escrow"
          value={formatCurrency(
            bounties.reduce((sum, b) => sum + b.reward, 0),
          )}
        />
        <StatCard label="Repositories synced" value="3" />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">
        Pull requests awaiting merge
      </h2>
      <div className="mt-6 space-y-3">
        {needsReview.map((bounty) => (
          <div
            key={bounty.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div>
              <p className="text-xs text-slate-500">
                {bounty.org}/{bounty.repo} #{bounty.issueNumber}
              </p>
              <p className="font-medium text-white">{bounty.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={bounty.status} />
              <span className="font-medium text-emerald-400">
                {formatCurrency(bounty.reward, bounty.asset)}
              </span>
            </div>
          </div>
        ))}
        {needsReview.length === 0 && (
          <p className="text-sm text-slate-500">Nothing awaiting review.</p>
        )}
      </div>
    </div>
  );
}
