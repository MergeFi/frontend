import { notFound } from "next/navigation";
import { ShieldCheck, Clock, GitBranch, Milestone as MilestoneIcon } from "lucide-react";
import { fetchBounty } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { StatusBadge, DifficultyBadge, Badge } from "@/components/ui/Badge";
import { BountyDescription } from "@/components/bounty/BountyDescription";
import { formatCurrency, daysUntil } from "@/lib/utils";
import { IssueActions } from "./IssueActions";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bounty = await fetchBounty(
    id,
    mockBounties.find((b) => b.id === id),
  );

  if (!bounty) notFound();

  const days = daysUntil(bounty.deadline);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {bounty.org}/{bounty.repo} #{bounty.issueNumber}
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{bounty.title}</h1>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">
          {formatCurrency(bounty.reward, bounty.asset)}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={bounty.status} />
        <DifficultyBadge difficulty={bounty.difficulty} />
        {bounty.labels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
      </div>

      <BountyDescription description={bounty.description} />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Escrow status</span>
          </div>
          <p className="mt-2 font-medium text-slate-900 dark:text-white">
            {bounty.status === "open" ? "Awaiting funding" : "Funds locked"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Deadline</span>
          </div>
          <p className="mt-2 font-medium text-slate-900 dark:text-white">
            {days > 0 ? `${days} days left` : "Passed"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <GitBranch className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Claimed by</span>
          </div>
          <p className="mt-2 font-medium text-slate-900 dark:text-white">
            {bounty.claimedBy ?? "Unclaimed"}
          </p>
        </div>
        {bounty.milestoneId && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <MilestoneIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm">Milestone</span>
            </div>
            <p className="mt-2 font-medium text-slate-900 dark:text-white">
              Part of a funded milestone
            </p>
          </div>
        )}
      </div>

      {bounty.teamSplits && bounty.teamSplits.length > 0 && (
        <div className="mt-8">
          <h2 className="font-medium text-slate-900 dark:text-white">Team payout split</h2>
          {bounty.teamSplitsValid && !bounty.teamSplitsValid.valid && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              ⚠️ {bounty.teamSplitsValid.message ?? "Team splits do not sum to 100%."}
            </div>
          )}
          <div className="mt-3 space-y-2">
            {bounty.teamSplits.map((split) => (
              <div
                key={split.role}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  {split.role}
                  {split.contributor ? ` (${split.contributor})` : ""}
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {split.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <IssueActions bounty={bounty} />
    </div>
  );
}
