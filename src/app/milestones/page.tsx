import { fetchWithFallback } from "@/lib/api";
import { mockMilestones, mockMaintenancePools } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Milestone, MaintenancePool } from "@/types";

export const metadata = {
  title: "Milestones — MergeFi",
};

export default async function MilestonesPage() {
  const milestones = await fetchWithFallback<Milestone[]>(
    "/milestones",
    mockMilestones,
  );
  const pools = await fetchWithFallback<MaintenancePool[]>(
    "/maintenance-pools",
    mockMaintenancePools,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Milestone funding</h1>
      <p className="mt-2 text-slate-400">
        Sponsors can fund an entire release instead of a single issue. Budget
        is distributed automatically across the milestone&apos;s issues as
        each one resolves.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {milestones.map((m) => {
          const pct = m.distributed / m.budget;
          return (
            <div
              key={m.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <p className="text-xs text-slate-500">{m.repo}</p>
              <h3 className="mt-1 font-medium text-white">{m.name}</h3>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(pct * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                <span>
                  {formatCurrency(m.distributed, m.asset)} of{" "}
                  {formatCurrency(m.budget, m.asset)}
                </span>
                <span>{formatPercent(pct)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {m.completedCount} of {m.issueCount} issues complete
              </p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-16 text-2xl font-semibold text-white">
        Recurring maintenance pools
      </h2>
      <p className="mt-2 text-slate-400">
        Sponsors deposit monthly so maintainers can reward ongoing upkeep —
        dependency bumps, docs, cleanup — that would otherwise go unfunded.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <p className="text-xs text-slate-500">{pool.repo}</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(pool.balance, pool.asset)} balance
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {formatCurrency(pool.monthlyDeposit, pool.asset)} deposited monthly
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
