"use client";

import { formatHours } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import type { ReputationProfile } from "@/types";

export function ReputationProfileView({ profile }: { profile: ReputationProfile }) {
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
          value={profile.lifetimeEarnings}
          format="currency"
        />
        <StatCard
          label="Merged PRs"
          value={profile.mergedPRs}
          format="count"
        />
        <StatCard
          label="Completion rate"
          value={profile.completionRate}
          format="percent"
        />
        <StatCard
          label="On-time delivery"
          value={profile.onTimeDeliveryRate}
          format="percent"
        />
      </div>

      <div className="mt-8">
        <Card>
          <h2 className="font-medium text-slate-900 dark:text-white">Languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <Badge key={lang}>{lang}</Badge>
            ))}
            {profile.languages.length === 0 && (
              <span className="text-sm text-slate-400 dark:text-slate-500">No data yet.</span>
            )}
          </div>
        </Card>
      </div>

      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        Average review time: {formatHours(profile.avgReviewTimeHours)}
      </p>
    </div>
  );
}
