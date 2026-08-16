import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Bounty, BountyStatus } from "@/types";

// Statuses shown as a pipeline column, in left-to-right order.
export const pipelineStages: { status: BountyStatus; label: string }[] = [
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

/**
 * Renders the Kanban-style pipeline board. Extracted from the page's async
 * Server Component (#88) so it's a plain function of already-fetched
 * `bounties`, testable without mocking data-fetching, DashboardShell, etc.
 */
export function PipelineBoard({ bounties }: { bounties: Bounty[] }) {
  return (
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
  );
}
