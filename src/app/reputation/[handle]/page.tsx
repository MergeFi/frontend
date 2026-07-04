import { notFound } from "next/navigation";
import { fetchReputationByUsername } from "@/lib/api";
import { mockReputationProfiles } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function ReputationPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await fetchReputationByUsername(
    handle,
    mockReputationProfiles[handle] ?? null,
  );

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center gap-4">
        <Avatar seed={profile.handle} src={profile.avatarUrl} size={64} className="rounded-2xl" />
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            @{profile.handle}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.organizations.map((org) => (
              <Badge key={org}>{org}</Badge>
            ))}
            {profile.organizations.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                No contributions recorded yet.
              </span>
            )}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-slate-900 dark:text-white">Languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <Badge key={lang}>{lang}</Badge>
            ))}
            {profile.languages.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500">No data yet.</span>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-medium text-slate-900 dark:text-white">Top clients</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.topClients.map((client) => (
              <Badge key={client}>{client}</Badge>
            ))}
            {profile.topClients.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500">No data yet.</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        Average review time: {profile.avgReviewTimeHours.toFixed(1)}h
      </p>
    </div>
  );
}
