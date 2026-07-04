import { notFound } from "next/navigation";
import { ShieldCheck, Clock, GitBranch } from "lucide-react";
import { fetchWithFallback } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { StatusBadge, DifficultyBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, daysUntil } from "@/lib/utils";
import type { Bounty } from "@/types";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bounties = await fetchWithFallback<Bounty[]>("/bounties", mockBounties);
  const bounty = bounties.find((b) => b.id === id);

  if (!bounty) notFound();

  const days = daysUntil(bounty.deadline);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm text-slate-500">
        {bounty.org}/{bounty.repo} #{bounty.issueNumber}
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">{bounty.title}</h1>
        <p className="text-2xl font-semibold text-emerald-400">
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

      <p className="mt-6 leading-relaxed text-slate-300">{bounty.description}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">Escrow status</span>
          </div>
          <p className="mt-2 font-medium text-white">Funds locked</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">Deadline</span>
          </div>
          <p className="mt-2 font-medium text-white">
            {days > 0 ? `${days} days left` : "Passed"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">Claimed by</span>
          </div>
          <p className="mt-2 font-medium text-white">
            {bounty.claimedBy ?? "Unclaimed"}
          </p>
        </div>
      </div>

      {bounty.teamSplits && (
        <div className="mt-8">
          <h2 className="font-medium text-white">Team payout split</h2>
          <div className="mt-3 space-y-2">
            {bounty.teamSplits.map((split) => (
              <div
                key={split.role}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
              >
                <span className="text-slate-300">
                  {split.role}
                  {split.contributor ? ` — ${split.contributor}` : ""}
                </span>
                <span className="font-medium text-emerald-400">
                  {split.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex gap-4">
        {bounty.status === "open" && <Button size="lg">Claim this issue</Button>}
        {bounty.status !== "open" && (
          <Button size="lg" variant="outline" disabled>
            {bounty.status === "paid" ? "Payout complete" : "Already claimed"}
          </Button>
        )}
      </div>
    </div>
  );
}
