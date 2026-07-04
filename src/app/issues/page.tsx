import { fetchWithFallback } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { BountyCard } from "@/components/bounty/BountyCard";
import type { Bounty } from "@/types";

export const metadata = {
  title: "Paid Issues — MergeFi",
};

export default async function IssuesPage() {
  const bounties = await fetchWithFallback<Bounty[]>("/bounties", mockBounties);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Paid issues</h1>
        <p className="mt-2 text-slate-400">
          Every bounty below is backed by funds already locked in a Soroban
          escrow contract. Claim one, open a pull request, and get paid the
          moment it&apos;s merged.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {bounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </div>
  );
}
