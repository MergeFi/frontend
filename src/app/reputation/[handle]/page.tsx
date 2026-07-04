import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchWithFallback } from "@/lib/api";
import { mockReputationProfiles } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ReputationProfile } from "@/types";

export default async function ReputationPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await fetchWithFallback<ReputationProfile | null>(
    `/reputation/${handle}`,
    mockReputationProfiles[handle] ?? null,
  );

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-4">
        <Image
          src={profile.avatarUrl}
          alt={profile.handle}
          width={64}
          height={64}
          className="rounded-full"
          unoptimized
        />
        <div>
          <h1 className="text-2xl font-semibold text-white">
            @{profile.handle}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.organizations.map((org) => (
              <Badge key={org}>{org}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Lifetime earnings"
          value={formatCurrency(profile.lifetimeEarnings)}
        />
        <StatCard label="Merged PRs" value={String(profile.mergedPRs)} />
        <StatCard
          label="Completion rate"
          value={formatPercent(profile.completionRate)}
        />
        <StatCard
          label="On-time delivery"
          value={formatPercent(profile.onTimeDeliveryRate)}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="font-medium text-white">Languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <Badge key={lang}>{lang}</Badge>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="font-medium text-white">Top clients</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.topClients.map((client) => (
              <Badge key={client}>{client}</Badge>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Average review time: {profile.avgReviewTimeHours}h
      </p>
    </div>
  );
}
