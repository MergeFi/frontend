"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DollarSign, GitMerge, TrendingUp, ListChecks, GitPullRequest } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { StatCard, type StatCardStatus } from "@/components/ui/StatCard";
import { BarChart } from "@/components/ui/BarChart";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { BountyCard } from "@/components/bounty/BountyCard";
import { formatCurrency } from "@/lib/utils";
import { apiPost, fetchBounties } from "@/lib/api";
import {
  mockReputationProfiles,
  mockBounties,
  recentActivity,
  contributorEarningsHistory,
  contributorSparkline,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import type { Bounty } from "@/types";

interface ReputationSnapshot {
  totalEarnings: string;
  mergedPrCount: number;
  completionRate: string;
}

interface DashboardStats {
  handle: string;
  lifetimeEarnings: number;
  mergedPRs: number;
  completionRate: number;
}

const earningsChartData = contributorEarningsHistory.map((value, i) => ({
  label: `W${i + 1}`,
  value,
}));

export default function ContributorDashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>(mockBounties);
  const [isLive, setIsLive] = useState(false);
  const [tab, setTab] = useState<"active" | "completed">("active");
  // Explicit fetch status: starts "loading" so cards shimmer rather than
  // flashing zeroes while the auth check + API call are in flight.
  const [fetchStatus, setFetchStatus] = useState<StatCardStatus>("loading");
  const [bountiesFetchStatus, setBountiesFetchStatus] = useState<StatCardStatus>("loading");
  const statsGenRef = useRef(0);
  const bountiesGenRef = useRef(0);

  useEffect(() => {
    const gen = ++bountiesGenRef.current;
    setBountiesFetchStatus("loading");
    fetchBounties(mockBounties)
      .then((data) => {
        if (gen === bountiesGenRef.current) {
          setBounties(data);
          // fetchBounties falls back to mock internally on error, so we can't
          // distinguish live vs fallback here — but we can at least mark loaded.
          setBountiesFetchStatus("loaded");
        }
      })
      .catch(() => {
        if (gen === bountiesGenRef.current) {
          setBountiesFetchStatus("error");
        }
      });
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const demo = mockReputationProfiles.priyaeth;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats({
        handle: demo.handle,
        lifetimeEarnings: demo.lifetimeEarnings,
        mergedPRs: demo.mergedPRs,
        completionRate: demo.completionRate,
      });
      setFetchStatus("loaded");
      setIsLive(false);
      return;
    }

    const gen = ++statsGenRef.current;
    setFetchStatus("loading");

    apiPost<ReputationSnapshot>(`/reputation/${user.id}/recompute`)
      .then((snapshot) => {
        if (gen !== statsGenRef.current) return;
        setStats({
          handle: user.username,
          lifetimeEarnings: Number(snapshot.totalEarnings),
          mergedPRs: snapshot.mergedPrCount,
          completionRate: Number(snapshot.completionRate) / 100,
        });
        setFetchStatus("loaded");
        setIsLive(true);
      })
      .catch(() => {
        if (gen !== statsGenRef.current) return;
        setStats(null);
        setFetchStatus("error");
        setIsLive(false);
      });
  }, [user, loading]);

  // Derive display handle: show username if live, else demo handle.
  const handle = stats?.handle ?? (user?.username ?? "you");

  const mine = bounties.filter((b) => b.claimedBy === handle);
  const activeClaims = mine.filter((b) => !["paid", "refunded", "expired"].includes(b.status));
  const completedClaims = mine.filter((b) => b.status === "paid");
  const available = bounties.filter((b) => b.status === "open");
  const shownClaims = tab === "active" ? activeClaims : completedClaims;

  return (
    <DashboardShell
      role="contributor"
      title={`Welcome back, @${handle}`}
      subtitle={isLive ? undefined : "Sign in with GitHub to see your own earnings and claims."}
      badge={
        (() => {
          const allLive = isLive && fetchStatus === "loaded" && bountiesFetchStatus === "loaded";
          const anyError = fetchStatus === "error" || bountiesFetchStatus === "error";
          let label = "Demo data";
          let colorClass = "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30";
          if (allLive) {
            label = "Live data";
            colorClass = "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30";
          } else if (anyError) {
            label = "Partial data";
            colorClass = "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30";
          }
          return (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClass}`}>
              {label}
            </span>
          );
        })()
      }
      action={
        <Link href="/issues">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            Find work
          </span>
        </Link>
      }
    >
      {/* StatCards show skeletons on initial load, errors on fetch failure —
          never a misleading "0 USDC" or "0 PRs" during loading/error states. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Lifetime earnings"
          value={stats?.lifetimeEarnings}
          format="currency"
          status={fetchStatus}
          icon={DollarSign}
          trend={fetchStatus === "loaded" ? 12 : undefined}
          sparkline={fetchStatus === "loaded" ? contributorEarningsHistory : undefined}
          zeroLabel="No earnings yet"
        />
        <StatCard
          label="Merged PRs"
          value={stats?.mergedPRs}
          format="count"
          status={fetchStatus}
          icon={GitMerge}
          trend={fetchStatus === "loaded" ? 8 : undefined}
          sparkline={fetchStatus === "loaded" ? contributorSparkline : undefined}
          zeroLabel="No merged PRs yet"
        />
        <StatCard
          label="Completion rate"
          // Completion rate is a fraction (0–1); format="percent" multiplies by 100
          value={stats?.completionRate}
          format="percent"
          status={fetchStatus}
          icon={TrendingUp}
          zeroLabel="No completions yet"
        />
        <StatCard
          label="Active claims"
          // Only derive activeClaims.length when stats is resolved — avoids
          // passing length=0 (via an empty filter on handle="you") while
          // the fetch is still in-flight or has errored.
          value={stats !== null ? activeClaims.length : undefined}
          format="count"
          status={fetchStatus}
          icon={ListChecks}
          zeroLabel="No active claims"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-slate-900 dark:text-white">Earnings, last 8 weeks</h2>
          <div className="mt-6">
            <BarChart data={earningsChartData} formatValue={(v) => formatCurrency(v)} />
          </div>
        </div>
        <div>
          <h2 className="font-medium text-slate-900 dark:text-white">Recent activity</h2>
          <div className="mt-4">
            <ActivityList events={recentActivity.slice(0, 4)} />
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your claims</h2>
        <Tabs
          tabs={[
            { key: "active", label: "Active", count: activeClaims.length },
            { key: "completed", label: "Completed", count: completedClaims.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {shownClaims.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
      {shownClaims.length === 0 && (
        <EmptyState
          icon={GitPullRequest}
          title={tab === "active" ? "No active claims" : "Nothing completed yet"}
          description={
            tab === "active"
              ? "Claim a bounty from the list below to get started."
              : "Completed and paid-out bounties will show up here."
          }
        />
      )}

      <h2 className="mt-12 text-xl font-semibold text-slate-900 dark:text-white">
        Recommended for you
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {available.slice(0, 4).map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </DashboardShell>
  );
}
