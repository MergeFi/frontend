"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { BountyCard } from "@/components/bounty/BountyCard";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { adaptBounty, type RawBounty, type RawMilestone } from "@/lib/adapters";
import { mockSponsorSummary, mockBounties } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import type { Bounty } from "@/types";

interface SponsorDashboardData {
  activeBounties: Bounty[];
  totalSpent: number;
  budgetLocked: number;
  repoCount: number;
}

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
    return <div className="mx-auto max-w-6xl px-6 py-12 text-slate-400 dark:text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          {user ? `${user.displayName ?? user.username}'s sponsorships` : mockSponsorSummary.name}
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
      <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
        {isLive
          ? "Track spending, active bounties, and escrowed budget across the repositories you fund."
          : "Sign in with GitHub to see your own sponsorships. Showing sample data for now."}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total paid out" value={formatCurrency(data.totalSpent)} />
        <StatCard label="Active bounties" value={String(data.activeBounties.length)} />
        <StatCard label="Locked in escrow" value={formatCurrency(data.budgetLocked)} />
        <StatCard label="Repositories" value={String(data.repoCount)} />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-slate-900 dark:text-white">Active bounties</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data.activeBounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
        {data.activeBounties.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No active bounties yet.</p>
        )}
      </div>
    </div>
  );
}
