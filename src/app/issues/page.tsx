import type { Metadata } from "next";
import { GitPullRequest } from "lucide-react";
import { fetchBounties } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { BountyCard } from "@/components/bounty/BountyCard";
import { EmptyState } from "@/components/ui/EmptyState";

const issuesDescription =
  "Browse paid, escrow-backed GitHub issues funded through MergeFi and ready for contributors.";

export const metadata: Metadata = {
  title: "Paid Issues | MergeFi",
  description: issuesDescription,
  openGraph: {
    title: "Paid Issues | MergeFi",
    description: issuesDescription,
    url: "/issues",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paid Issues | MergeFi",
    description: issuesDescription,
  },
};

export default async function IssuesPage() {
  const bounties = await fetchBounties(mockBounties);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Bounties
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Paid issues
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
          Every bounty below is backed by funds already locked in a Soroban
          escrow contract. Claim one, open a pull request, and get paid the
          moment it&apos;s merged.
        </p>
      </div>
      {bounties.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="No bounties yet"
          description="Check back soon — funded issues appear here once sponsors lock them in escrow."
        />
      ) : (
        <>
          <h2 className="sr-only">Available bounties</h2>
          <div className="grid gap-4 md:grid-cols-2">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
        </>
      )}
    </div>
  );
}
