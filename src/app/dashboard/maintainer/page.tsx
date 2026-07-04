import { fetchBounties } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Maintainer Dashboard | MergeFi",
};

export default async function MaintainerDashboardPage() {
  const bounties = await fetchBounties(mockBounties);
  const needsReview = bounties.filter((b) => b.status === "in_review");
  const open = bounties.filter((b) => b.status === "open" || b.status === "funded");
  const repoCount = new Set(bounties.map((b) => `${b.org}/${b.repo}`)).size;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        Maintainer
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        Bounty pipeline
      </h1>
      <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
        Create bounties from your GitHub issues and approve completed work.
        Payout release happens automatically once a linked pull request is
        merged. MergeFi detects it via GitHub webhook.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Open bounties" value={String(open.length)} />
        <StatCard label="Awaiting review" value={String(needsReview.length)} />
        <StatCard
          label="Total value in escrow"
          value={formatCurrency(bounties.reduce((sum, b) => sum + b.reward, 0))}
        />
        <StatCard label="Repositories synced" value={String(repoCount)} />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-slate-900 dark:text-white">
        Pull requests awaiting merge
      </h2>
      <div className="mt-6 space-y-3">
        {needsReview.map((bounty) => (
          <div
            key={bounty.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bounty.org}/{bounty.repo} #{bounty.issueNumber}
              </p>
              <p className="font-medium text-slate-900 dark:text-white">{bounty.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={bounty.status} />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(bounty.reward, bounty.asset)}
              </span>
            </div>
          </div>
        ))}
        {needsReview.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nothing awaiting review.</p>
        )}
      </div>
    </div>
  );
}
