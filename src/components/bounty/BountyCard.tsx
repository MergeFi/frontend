import Link from "next/link";
import { Clock, GitPullRequest } from "lucide-react";
import { StatusBadge, DifficultyBadge, Badge } from "@/components/ui/Badge";
import { formatCurrency, daysUntil } from "@/lib/utils";
import type { Bounty } from "@/types";

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const days = daysUntil(bounty.deadline);
  return (
    <Link
      href={`/issues/${bounty.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            {bounty.org}/{bounty.repo} #{bounty.issueNumber}
          </p>
          <h3 className="mt-1 font-medium text-white">{bounty.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-emerald-400">
            {formatCurrency(bounty.reward, bounty.asset)}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-400">{bounty.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={bounty.status} />
        <DifficultyBadge difficulty={bounty.difficulty} />
        {bounty.labels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {days > 0 ? `${days}d left` : "Deadline passed"}
        </span>
        {bounty.claimedBy && (
          <span className="flex items-center gap-1">
            <GitPullRequest className="h-3.5 w-3.5" />
            claimed by {bounty.claimedBy}
          </span>
        )}
      </div>
    </Link>
  );
}
