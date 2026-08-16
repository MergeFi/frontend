import { fetchMilestones, fetchMaintenancePools } from "@/lib/api";
import { mockMilestones, mockMaintenancePools } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { MilestoneFundButton, PoolDepositButton } from "./MilestoneActions";

export const metadata = {
  title: "Milestones | MergeFi",
};

export default async function MilestonesPage() {
  const milestones = await fetchMilestones(mockMilestones);
  const pools = await fetchMaintenancePools(mockMaintenancePools);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        Funding
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        Milestone funding
      </h1>
      <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
        Sponsors can fund an entire release instead of a single issue. Budget
        is distributed automatically across the milestone&apos;s issues as
        each one resolves.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {milestones.map((m) => {
          const isUnfunded = m.budget <= 0;
          const isOverDistributed = !isUnfunded && m.distributed > m.budget;
          // Guard against budget === 0 / negative budget to prevent NaN / Infinity in CSS and DOM
          const rawPct = isUnfunded ? 0 : m.distributed / m.budget;
          // Clamp progress bar and display percentage consistently between 0 and 1 (0% to 100%)
          const clampedPct = Math.max(0, Math.min(rawPct, 1));
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">{m.repo}</p>
              <h3 className="mt-1 font-medium text-slate-900 dark:text-white">{m.name}</h3>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${clampedPct * 100}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>
                  {formatCurrency(m.distributed, m.asset)} of{" "}
                  {formatCurrency(m.budget, m.asset)}
                </span>
                <span className="flex items-center gap-1.5">
                  {isUnfunded ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Not yet funded
                    </span>
                  ) : (
                    <>
                      <span>{formatPercent(clampedPct)}</span>
                      {isOverDistributed && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Over-budget
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {m.completedCount} of {m.issueCount} issues complete
              </p>
              <MilestoneFundButton milestoneId={m.id} />
            </div>
          );
        })}
      </div>

      <h2 className="mt-16 text-2xl font-semibold text-slate-900 dark:text-white">
        Recurring maintenance pools
      </h2>
      <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
        Sponsors deposit monthly so maintainers can reward ongoing upkeep, like
        dependency bumps, docs, and cleanup, that would otherwise go unfunded.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{pool.repo}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {formatCurrency(pool.balance, pool.asset)} balance
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {formatCurrency(pool.monthlyDeposit, pool.asset)} deposited monthly
            </p>
            <PoolDepositButton poolId={pool.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
