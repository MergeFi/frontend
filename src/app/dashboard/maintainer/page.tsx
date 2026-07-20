import Link from "next/link";
import { Layers, Clock, Coins, FolderGit2, CheckCircle2 } from "lucide-react";
import { fetchBounties } from "@/lib/api";
import { mockBounties, recentActivity, bountiesCompletedSparkline } from "@/lib/mock-data";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency } from "@/lib/utils";
import type { Bounty, BountyStatus } from "@/types";

const pipelineStages: { status: BountyStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "funded", label: "Funded" },
  { status: "claimed", label: "Claimed" },
  { status: "in_review", label: "In review" },
];

function PipelineColumn({ label, bounties }: { label: string; bounties: Bounty[] }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {bounties.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {bounties.map((b) => (
          <Link
            key={b.id}
            href={`/issues/${b.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
          >
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              {b.org}/{b.repo} #{b.issueNumber}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
              {b.title}
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(b.reward, b.asset)}
            </p>
          </Link>
        ))}
        {bounties.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Nothing here
          </p>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: "Maintainer Dashboard | MergeFi",
};

export default async function MaintainerDashboardPage() {
  // Maintainer dashboard is a Server Component (no client-side loading state).
  // We wrap fetchBounties in a try/catch so that if the fetch fails, the cards
  // explicitly show "Error loading data" rather than rendering stale zeros or
  // crashing the page render.
  let bounties: Bounty[] = [];
  let statStatus: "loaded" | "error" = "loaded";

  try {
    bounties = await fetchBounties(mockBounties);
  } catch {
    statStatus = "error";
  }

  const needsReview = bounties.filter((b) => b.status === "in_review");
  const open = bounties.filter((b) => b.status === "open" || b.status === "funded");
  const repoCount = new Set(bounties.map((b) => `${b.org}/${b.repo}`)).size;
  const totalEscrow = bounties
    .filter((b) => !["open", "paid", "refunded", "expired"].includes(b.status))
    .reduce((sum, b) => sum + b.reward, 0);

  return (
    <DashboardShell
      role="maintainer"
      title="Bounty pipeline"
      subtitle="Create bounties from your GitHub issues and approve completed work. Payout release happens automatically once a linked pull request is merged."
      action={
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">
          Create bounty
        </span>
      }
    >
      {/* Pass statStatus so that a fetchBounties failure renders error states
          on all four cards instead of silently showing zeros. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Open bounties"
          value={open.length}
          format="count"
          status={statStatus}
          icon={Layers}
          zeroLabel="No open bounties"
        />
        <StatCard
          label="Awaiting review"
          value={needsReview.length}
          format="count"
          status={statStatus}
          icon={Clock}
          zeroLabel="All caught up"
        />
        <StatCard
          label="Value locked in escrow"
          value={totalEscrow}
          format="currency"
          status={statStatus}
          icon={Coins}
          sparkline={statStatus === "loaded" ? bountiesCompletedSparkline : undefined}
          zeroLabel="Nothing in escrow yet"
        />
        <StatCard
          label="Repositories synced"
          value={repoCount}
          format="count"
          status={statStatus}
          icon={FolderGit2}
          zeroLabel="No repositories yet"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-medium text-slate-900 dark:text-white">Pipeline</h2>
        <div className="mt-5 flex gap-4 overflow-x-auto">
          {pipelineStages.map((stage) => (
            <PipelineColumn
              key={stage.status}
              label={stage.label}
              bounties={bounties.filter((b) => b.status === stage.status)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Pull requests awaiting merge
          </h2>
          <div className="mt-4 space-y-3">
            {needsReview.map((bounty) => (
              <div
                key={bounty.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <Avatar seed={`${bounty.org}/${bounty.repo}`} size={36} className="rounded-xl" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {bounty.org}/{bounty.repo} #{bounty.issueNumber}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">{bounty.title}</p>
                    {bounty.claimedBy && (
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        by {bounty.claimedBy}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={bounty.status} />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(bounty.reward, bounty.asset)}
                  </span>
                </div>
              </div>
            ))}
            {needsReview.length === 0 && (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up"
                description="No pull requests are waiting on your review right now."
              />
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Recent activity
          </h2>
          <div className="mt-4">
            <ActivityList events={recentActivity.slice(0, 5)} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
