"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Receipt, Lock, FolderGit2, Inbox } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { StatCard } from "@/components/ui/StatCard";
import { BarChart } from "@/components/ui/BarChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { BountyCard } from "@/components/bounty/BountyCard";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { adaptBounty, type RawBounty, type RawMilestone } from "@/lib/adapters";
import {
  mockSponsorSummary,
  mockBounties,
  recentActivity,
  sponsorSpendHistory,
  sponsorSpendByRepo,
  budgetSparkline,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import type { Bounty } from "@/types";

interface SponsorDashboardData {
  activeBounties: Bounty[];
  totalSpent: number;
  budgetLocked: number;
  repoCount: number;
}

const spendChartData = sponsorSpendHistory.map((value, i) => ({
  label: `W${i + 1}`,
  value,
}));

const maxRepoSpend = Math.max(...sponsorSpendByRepo.map((r) => r.amount));

export default function SponsorDashboardPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<SponsorDashboardData | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Demo-mode fallback when signed out; live branch below fetches async.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData({
        activeBounties: mockBounties.filter((b) =>
          ["open", "funded", "claimed", "in_review"].includes(b.status),
        ),
        totalSpent: mockSponsorSummary.totalFunded - mockSponsorSummary.budgetRemaining,
        budgetLocked: mockSponsorSummary.budgetRemaining,
        repoCount: mockSponsorSummary.repos.length,
      });
      setIsLive(false);
      return;
    }
    apiRequest<{
      activeBounties: RawBounty[];
      totalSpent: number;
      budgetLocked: number;
      activeMilestones: RawMilestone[];
    }>(`/sponsors/${user.id}/dashboard`)
      .then((raw) => {
        const activeBounties = raw.activeBounties.map(adaptBounty);
        const repoCount = new Set(activeBounties.map((b) => `${b.org}/${b.repo}`)).size;
        setData({
          activeBounties,
          totalSpent: raw.totalSpent,
          budgetLocked: raw.budgetLocked,
          repoCount,
        });
        setIsLive(true);
      })
      .catch(() => {
        setData({
          activeBounties: mockBounties.filter((b) =>
            ["open", "funded", "claimed", "in_review"].includes(b.status),
          ),
          totalSpent: mockSponsorSummary.totalFunded - mockSponsorSummary.budgetRemaining,
          budgetLocked: mockSponsorSummary.budgetRemaining,
          repoCount: mockSponsorSummary.repos.length,
        });
        setIsLive(false);
      });
  }, [user, loading]);

  if (!data) {
    return <div className="mx-auto max-w-7xl px-6 py-12 text-slate-400 dark:text-slate-500">Loading…</div>;
  }

  return (
    <DashboardShell
      role="sponsor"
      title={user ? `${user.displayName ?? user.username}'s sponsorships` : mockSponsorSummary.name}
      subtitle={
        isLive
          ? "Track spending, active bounties, and escrowed budget across the repositories you fund."
          : "Sign in with GitHub to see your own sponsorships. Showing sample data for now."
      }
      badge={
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            isLive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
              : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30"
          }`}
        >
          {isLive ? "Live data" : "Demo data"}
        </span>
      }
      action={
        <Link href="/issues">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">
            Fund a bounty
          </span>
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total paid out"
          value={formatCurrency(data.totalSpent)}
          icon={Receipt}
          trend={18}
          sparkline={sponsorSpendHistory}
        />
        <StatCard label="Active bounties" value={String(data.activeBounties.length)} icon={Wallet} />
        <StatCard
          label="Locked in escrow"
          value={formatCurrency(data.budgetLocked)}
          icon={Lock}
          sparkline={budgetSparkline}
        />
        <StatCard label="Repositories" value={String(data.repoCount)} icon={FolderGit2} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-slate-900 dark:text-white">Spend, last 8 weeks</h2>
          <div className="mt-6">
            <BarChart data={spendChartData} formatValue={(v) => formatCurrency(v)} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-slate-900 dark:text-white">Spend by repository</h2>
          <div className="mt-5 space-y-3">
            {sponsorSpendByRepo.map((r) => (
              <div key={r.repo}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{r.repo}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(r.amount)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                    style={{ width: `${(r.amount / maxRepoSpend) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Active bounties</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data.activeBounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
      {data.activeBounties.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No active bounties"
          description="Fund an issue to see it appear here once it's live."
        />
      )}

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Recent activity</h2>
      <div className="mt-4">
        <ActivityList events={recentActivity.slice(0, 5)} />
      </div>
    </DashboardShell>
  );
}
