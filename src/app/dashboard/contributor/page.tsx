"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { BountyCard } from "@/components/bounty/BountyCard";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { apiPost, fetchBounties } from "@/lib/api";
import { mockReputationProfiles, mockBounties } from "@/lib/mock-data";
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

export default function ContributorDashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>(mockBounties);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchBounties(mockBounties).then(setBounties);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const demo = mockReputationProfiles.priyaeth;
      // Demo-mode fallback when signed out; live branch below fetches async.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats({
        handle: demo.handle,
        lifetimeEarnings: demo.lifetimeEarnings,
        mergedPRs: demo.mergedPRs,
        completionRate: demo.completionRate,
      });
      setIsLive(false);
      return;
    }
    apiPost<ReputationSnapshot>(`/reputation/${user.id}/recompute`)
      .then((snapshot) => {
        setStats({
          handle: user.username,
          lifetimeEarnings: Number(snapshot.totalEarnings),
          mergedPRs: snapshot.mergedPrCount,
          completionRate: Number(snapshot.completionRate) / 100,
        });
        setIsLive(true);
      })
      .catch(() => {
        setStats({
          handle: user.username,
          lifetimeEarnings: 0,
          mergedPRs: 0,
          completionRate: 0,
        });
        setIsLive(true);
      });
  }, [user, loading]);

  const mine = bounties.filter((b) => b.claimedBy === stats?.handle);
  const available = bounties.filter((b) => b.status === "open");

  if (!stats) {
    return <div className="mx-auto max-w-6xl px-6 py-12 text-slate-400 dark:text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Welcome back, @{stats.handle}
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            isLive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
              : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30"
          }`}
        >
          {isLive ? "Live data" : "Demo data"}
        </span>
      </div>
      {!isLive && (
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Sign in with GitHub to see your own earnings and claims.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Lifetime earnings"
          value={formatCurrency(stats.lifetimeEarnings)}
        />
        <StatCard label="Merged PRs" value={String(stats.mergedPRs)} />
        <StatCard
          label="Completion rate"
          value={formatPercent(stats.completionRate)}
        />
        <StatCard label="Active claims" value={String(mine.length)} />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-slate-900 dark:text-white">Your claims</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {mine.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
        {mine.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven&apos;t claimed any issues yet.
          </p>
        )}
      </div>

      <h2 className="mt-12 text-xl font-semibold text-slate-900 dark:text-white">
        Recommended for you
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {available.slice(0, 4).map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </div>
  );
}
